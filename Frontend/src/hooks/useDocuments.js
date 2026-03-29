// =============================================================================
// src/hooks/useDocuments.js — All document page state in one place.
//
// Owns:
//   documents        — fetched list of MedicalDocumentDto
//   isLoading        — skeleton while GET is in-flight
//   isUploading      — true while XHR multipart POST is in-flight
//   uploadProgress   — 0-100 integer, drives the progress bar
//   error            — non-fatal error string shown in the UI
//   pendingDelete    — the document staged for deletion (opens confirm modal)
//
// XHR upload:
//   We use XMLHttpRequest instead of Axios so we can listen to the
//   upload.onprogress event for real byte-level progress reporting.
//   The Authorization header is attached manually from localStorage.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMyDocumentsApi, deleteDocumentApi } from '../api/documentsApi';

export default function useDocuments() {
  const [documents,      setDocuments]      = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isUploading,    setIsUploading]    = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error,          setError]          = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');
  const [pendingDelete,  setPendingDelete]  = useState(null); // doc staged for deletion

  // Ref to allow cancelling in-flight XHR if component unmounts
  const xhrRef = useRef(null);

  // ── Fetch documents on mount ────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getMyDocumentsApi();
      setDocuments(data);
    } catch {
      setError('Could not load your documents. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    // Cancel any in-flight XHR on unmount
    return () => xhrRef.current?.abort();
  }, [fetchDocuments]);

  // ── Upload a document via XHR (for progress tracking) ──────────────────
  const uploadDocument = useCallback((file, documentName, appointmentId = null) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file',         file);
      formData.append('documentName', documentName);
      if (appointmentId) formData.append('appointmentId', appointmentId);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const token   = localStorage.getItem('sc_token');

      setIsUploading(true);
      setUploadProgress(0);
      setError('');

      // ── Progress events — fires as bytes are sent to the server ──────────
      // Note: progress reflects upload to your API server, not to Cloudinary.
      // The Cloudinary upload happens server-side after the API receives the file.
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 85); // cap at 85%
          // We cap at 85% because the remaining 15% is the server-side
          // Cloudinary upload + DB write — we simulate that with a slow crawl.
          setUploadProgress(pct);
        }
      };

      // ── Simulate the remaining 15% (Cloudinary + DB) ─────────────────────
      xhr.upload.onload = () => {
        // File has arrived at the API. Slowly tick 85 → 100 over ~1.5s.
        let pct = 85;
        const tick = setInterval(() => {
          pct += 3;
          setUploadProgress(Math.min(pct, 99)); // Hold at 99 until response arrives
          if (pct >= 99) clearInterval(tick);
        }, 150);
      };

      // ── Response received ─────────────────────────────────────────────────
      xhr.onload = () => {
        setUploadProgress(100);
        setIsUploading(false);
        xhrRef.current = null;

        if (xhr.status === 201) {
          try {
            const newDoc = JSON.parse(xhr.responseText);
            // Prepend to list — newest first
            setDocuments((prev) => [newDoc, ...prev]);
            resolve(newDoc);
          } catch {
            resolve(null);
          }
        } else {
          let message = 'Upload failed. Please try again.';
          try {
            const body = JSON.parse(xhr.responseText);
            if (body.message) message = body.message;
          } catch { /* use default */ }
          setError(message);
          reject(new Error(message));
        }
      };

      // ── Network error ─────────────────────────────────────────────────────
      xhr.onerror = () => {
        setIsUploading(false);
        setError('Network error. Please check your connection.');
        xhrRef.current = null;
        reject(new Error('Network error'));
      };

      // ── Abort ─────────────────────────────────────────────────────────────
      xhr.onabort = () => {
        setIsUploading(false);
        setUploadProgress(0);
        xhrRef.current = null;
        reject(new Error('Upload cancelled'));
      };

      // Open and send
      xhr.open('POST', `${apiBase}/documents/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // DO NOT set Content-Type — the browser sets it with the correct boundary
      xhr.send(formData);
    });
  }, []);

  // ── Delete a document ───────────────────────────────────────────────────
  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;

    const docId = pendingDelete.id;
    const prevDocs = documents;

    // Optimistic removal
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setPendingDelete(null);

    try {
      await deleteDocumentApi(docId);
      setSuccessMsg('Document deleted.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      // Rollback
      setDocuments(prevDocs);
      setError('Delete failed. Please try again.');
    }
  }, [pendingDelete, documents]);

  return {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    error, setError,
    successMsg, setSuccessMsg,
    pendingDelete, setPendingDelete,
    uploadDocument,
    confirmDelete,
    fetchDocuments,
  };
}