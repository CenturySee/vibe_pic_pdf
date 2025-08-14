"use client";

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileImage, FileText, LoaderCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function PdfToImagesClient() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState<string>('300');
  const [imageType, setImageType] = useState<string>('png');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
      }
      event.target.value = '';
    }
  };

  const removePdf = () => {
    setPdfFile(null);
  };

  const handleConvert = () => {
    if (!pdfFile) {
      toast({
        title: "No PDF selected",
        description: "Please upload a PDF file to convert.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    toast({
      title: "Conversion started",
      description: `Converting "${pdfFile.name}" to ${imageType.toUpperCase()} images.`,
    });

    // Simulate conversion
    setTimeout(() => {
      setIsConverting(false);
      const filename = pdfFile.name.replace(/\.pdf$/i, '');
      toast({
        title: "Conversion Successful!",
        description: `Your images are ready for download.`,
        variant: "default",
        className: "bg-accent text-accent-foreground border-accent",
        action: (
          <Button variant="outline" size="sm" onClick={() => alert('Download would start here!')}>
            Download ZIP
          </Button>
        ),
      });
    }, 2000);
  };

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
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="image-type">Image Format</Label>
                <Select value={imageType} onValueChange={setImageType}>
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
                <Select value={dpi} onValueChange={setDpi}>
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
