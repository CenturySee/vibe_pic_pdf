"use client";

import dynamic from 'next/dynamic';

const PdfToImagesClient = dynamic(() => import('./pdf-to-images-client'), {
  loading: () => <div className="flex items-center justify-center h-64">Loading PDF to Images...</div>
});

export default function PdfToImagesPage() {
  return <PdfToImagesClient />;
}
