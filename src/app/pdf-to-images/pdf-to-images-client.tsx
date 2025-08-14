"use client";

import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileImage, FileText, LoaderCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';


pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

async function getPdfPageAsImage(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number, dpi: number) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: dpi / 96 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) {
        throw new Error('Could not get canvas context');
    }

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return canvas;
}

export default function PdfToImagesClient() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSelection, setPageSelection] = useState<string>('all');
  const [customPages, setCustomPages] = useState<string>('');
  const [dpi, setDpi] = useState<string>('300');
  const [imageType, setImageType] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { toast, dismiss } = useToast();
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf') {
        // Reset state before loading new file
        removePdf();
        setPdfFile(file);
        setIsPreviewLoading(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument(arrayBuffer);
            const pdf = await loadingTask.promise;
            setPdfDoc(pdf);
            setNumPages(pdf.numPages);
            setCurrentPage(1);
            setPageSelection('all');
            setCustomPages('');
        } catch (error) {
            console.error("Failed to load PDF:", error);
            toast({
                title: "Error loading PDF",
                description: "Could not read the selected PDF file for preview.",
                variant: "destructive",
            });
            setPdfFile(null);
        } finally {
            setIsPreviewLoading(false);
        }

      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
      }
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  useEffect(() => {
    const renderPreview = async () => {
        if (pdfDoc && currentPage > 0 && currentPage <= numPages) {
            setIsPreviewLoading(true);
            try {
                const page = await pdfDoc.getPage(currentPage);
                const viewport = page.getViewport({ scale: 1.5 }); // Use a fixed scale for preview
                const previewCanvas = previewCanvasRef.current;
                 if (previewCanvas) {
                    const previewContext = previewCanvas.getContext('2d');
                    if (previewContext) {
                        // Clear canvas before rendering
                        previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                        previewCanvas.height = viewport.height;
                        previewCanvas.width = viewport.width;
                        
                        // Set canvas background to white
                        previewContext.fillStyle = 'white';
                        previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
                        
                        await page.render({ canvasContext: previewContext, viewport: viewport }).promise;
                    }
                 }
            } catch (e) {
                console.error("error rendering preview", e);
                // Show error toast if preview fails
                toast({
                    title: "Preview Error",
                    description: "Could not render PDF preview. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsPreviewLoading(false);
            }
        }
    };
    renderPreview();
  }, [pdfDoc, currentPage, numPages, toast]);

  const removePdf = () => {
    setPdfFile(null);
    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
        const context = previewCanvas.getContext('2d');
        if (context) {
            context.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        }
    }
    dismiss();
  };

  const handleConvert = async () => {
    if (!pdfDoc || !pdfFile) {
      toast({
        title: "No PDF selected",
        description: "Please upload a PDF file to convert.",
        variant: "destructive",
      });
      return;
    }

    let pagesToConvert: number[] = [];
    if (pageSelection === 'all') {
        pagesToConvert = Array.from({length: numPages}, (_, i) => i + 1);
    } else {
        const parts = customPages.split(/[,;]/).map(p => p.trim());
        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                  for (let i = start; i <= end; i++) {
                      pagesToConvert.push(i);
                  }
                }
            } else {
                const pageNum = Number(part);
                 if (!isNaN(pageNum)) {
                    pagesToConvert.push(pageNum);
                }
            }
        }
        pagesToConvert = [...new Set(pagesToConvert)].filter(p => p > 0 && p <= numPages).sort((a,b) => a-b);
    }

    if (pagesToConvert.length === 0) {
        toast({ title: "No pages selected", description: "Please specify which pages to convert.", variant: "destructive" });
        return;
    }


    setIsConverting(true);
    toast({
      title: "Conversion started",
      description: `Converting ${pagesToConvert.length} page(s) to ${imageType.toUpperCase()} images.`,
    });

    try {
        const zip = new JSZip();
        const baseFilename = pdfFile.name.replace(/\.pdf$/i, '');
        const padLength = String(numPages).length;

        for (const pageNum of pagesToConvert) {
            const canvas = await getPdfPageAsImage(pdfDoc, pageNum, parseInt(dpi));
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, `image/${imageType}`));
            if(blob) {
                const filename = `${baseFilename}-page-${String(pageNum).padStart(padLength, '0')}.${imageType}`;
                zip.file(filename, blob);
            }
        }

        const zipBlob = await zip.generateAsync({type:"blob"});
        const downloadUrl = URL.createObjectURL(zipBlob);
        const zipFilename = `${baseFilename}.zip`;

        toast({
            title: "Conversion Successful!",
            description: `Your images have been zipped into "${zipFilename}".`,
            variant: "default",
            duration: 10000,
            className: "bg-accent text-accent-foreground border-accent",
            action: (
              <Button variant="outline" size="sm" onClick={() => {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = zipFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
              }}
              className="bg-accent-foreground text-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Download className="mr-2 h-4 w-4"/>
                Download ZIP
              </Button>
            ),
          });

    } catch(error) {
        console.error("Image conversion failed:", error);
        toast({
            title: "Conversion Failed",
            description: "An error occurred while converting pages.",
            variant: "destructive",
        });
    } finally {
        setIsConverting(false);
    }
  };
  
  const handlePageNav = (direction: 'prev' | 'next') => {
      setCurrentPage(prev => {
          if (direction === 'prev') return Math.max(1, prev - 1);
          return Math.min(numPages, prev + 1);
      })
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <PageHeader
        title="PDF to Image Converter"
        description="Upload a PDF and convert each page into a high-resolution image. Choose your desired format and quality."
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>Select a single PDF file to convert.</CardDescription>
            </CardHeader>
            <CardContent>
              {!pdfFile ? (
                <label
                  htmlFor="pdf-upload"
                  className="relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary hover:bg-muted"
                >
                  <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
                  <span className="font-semibold text-primary">Click to upload</span>
                  <span className="text-sm text-muted-foreground">or drag and drop a PDF here</span>
                  <input id="pdf-upload" type="file" accept="application/pdf" className="sr-only" onChange={handleFileChange} />
                </label>
              ) : (
                <div>
                  <div className="flex items-center p-4 border rounded-lg shadow-sm">
                    <FileText className="w-10 h-10 mr-4 text-primary shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold truncate">{pdfFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="ml-2 shrink-0" onClick={removePdf}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="mt-4 border rounded-lg p-2 flex flex-col items-center justify-center bg-muted/50 min-h-[300px]">
                    {isPreviewLoading ? (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <LoaderCircle className="w-8 h-8 animate-spin text-primary"/>
                          <span>Loading Preview...</span>
                        </div>
                    ) : (
                        <canvas ref={previewCanvasRef} className="max-w-full h-auto rounded shadow-md"></canvas>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
             {pdfDoc && numPages > 0 && (
                <CardFooter className="flex items-center justify-center pt-4">
                     <Button variant="outline" size="icon" onClick={() => handlePageNav('prev')} disabled={currentPage <= 1 || isPreviewLoading}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="mx-4 text-sm font-medium">Page {currentPage} of {numPages}</span>
                     <Button variant="outline" size="icon" onClick={() => handlePageNav('next')} disabled={currentPage >= numPages || isPreviewLoading}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </CardFooter>
            )}
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label>Pages to Convert</Label>
                <Select value={pageSelection} onValueChange={setPageSelection} disabled={!pdfFile}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All pages</SelectItem>
                    <SelectItem value="custom">Custom pages</SelectItem>
                  </SelectContent>
                </Select>
                {pageSelection === 'custom' && (
                  <Input
                    value={customPages}
                    onChange={(e) => setCustomPages(e.target.value)}
                    placeholder="e.g., 1-3, 5, 8"
                    disabled={!pdfFile}
                  />
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image-type">Image Format</Label>
                <Select value={imageType} onValueChange={(v) => setImageType(v as any)} disabled={!pdfFile}>
                  <SelectTrigger id="image-type">
                    <SelectValue placeholder="Select image type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WEBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dpi">Resolution</Label>
                <Select value={dpi} onValueChange={setDpi} disabled={!pdfFile}>
                  <SelectTrigger id="dpi">
                    <SelectValue placeholder="Select DPI" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="150">150 DPI (Standard)</SelectItem>
                    <SelectItem value="300">300 DPI (High Quality)</SelectItem>
                    <SelectItem value="600">600 DPI (Print)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleConvert} disabled={isConverting || !pdfFile} className="w-full">
                {isConverting ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : <FileImage className="w-4 h-4 mr-2" />}
                Convert to Images
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
