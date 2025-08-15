"use client";

import dynamic from 'next/dynamic';

const ImagesToPdfClient = dynamic(() => import('./images-to-pdf-client'), {
  loading: () => <div className="flex items-center justify-center h-64">Loading Images to PDF...</div>
});

export default function ImagesToPdfPage() {
  return <ImagesToPdfClient />;
}
