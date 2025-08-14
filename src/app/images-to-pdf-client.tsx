"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, LoaderCircle, GripVertical, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

type PageOrientation = 'p' | 'l' | 'auto';
type PageMargin = 'none' | 'normal' | 'narrow' | 'moderate' | 'wide';

const ItemTypes = {
  IMAGE: 'image',
};

const MARGINS = {
    none: 0,
    narrow: 36, // 0.5 inch
    normal: 72, // 1 inch
    moderate: 72, // 1 inch top/bottom, 0.75 inch left/right, simplified to 1 inch for now
    wide: 144, // 2 inches
};


interface ImageCardProps {
  image: UploadedImage;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  removeImage: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, index, moveImage, removeImage }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.IMAGE,
    hover(item: { index: number }) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.IMAGE,
    item: () => ({ id: image.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={preview}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative group overflow-hidden rounded-lg shadow-sm"
    >
      <div ref={ref} className="cursor-move">
        <Image
          src={image.preview}
          alt={image.file.name}
          width={150}
          height={150}
          className="object-cover w-full h-40 transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <GripVertical className="absolute top-1/2 left-1 -translate-y-1/2 w-8 h-8 text-white/50" />
        </div>
        <button onClick={() => removeImage(image.id)} className="absolute top-1 right-1 h-6 w-6 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
            <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-white truncate bg-gradient-to-t from-black/70 to-transparent">
        <span className="font-bold">{index + 1}.</span> {image.file.name}
        </div>
      </div>
    </div>
  );
};


export default function ImagesToPdfClient() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [pdfName, setPdfName] = useState<string>('converted-document');
  const [pageSize, setPageSize] = useState<string>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('p');
  const [pageMargin, setPageMargin] = useState<PageMargin>('none');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      const newImages: UploadedImage[] = imageFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages(prev => [...prev, ...newImages]);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
        const imageToRemove = prev.find(img => img.id === id);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.preview);
        }
        return prev.filter(image => image.id !== id);
    });
  };

  const clearAllImages = () => {
    setImages(prev => {
        prev.forEach(image => URL.revokeObjectURL(image.preview));
        return [];
    });
  };
  
  const moveImage = useCallback((dragIndex: number, hoverIndex: number) => {
    setImages((prevImages) => {
      const newImages = [...prevImages];
      const draggedImage = newImages[dragIndex];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);
      return newImages;
    });
  }, []);

  const handleConvert = async () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload some images to convert.",
        variant: "destructive",
      });
      return;
    }
    
    setIsConverting(true);
    toast({
      title: "Conversion started",
      description: "Your PDF is being created.",
    });

    try {
        const initialOrientation = orientation === 'auto' ? 'p' : orientation;
        const doc = new jsPDF({
            orientation: initialOrientation,
            unit: 'pt', // Use points for margins
            format: pageSize.toLowerCase()
        });
        doc.deletePage(1);
        
        const marginValue = MARGINS[pageMargin];

        for (const image of images) {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const i = new window.Image();
                i.onload = () => resolve(i);
                i.onerror = reject;
                i.src = image.preview;
            });
            
            const imgWidth = img.width;
            const imgHeight = img.height;
            
            let pageOrientation: 'p' | 'l' = initialOrientation;
            if (orientation === 'auto') {
                pageOrientation = imgWidth > imgHeight ? 'l' : 'p';
            }

            doc.addPage(pageSize.toLowerCase(), pageOrientation);

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            const effectivePageWidth = pageWidth - (marginValue * 2);
            const effectivePageHeight = pageHeight - (marginValue * 2);

            const ratio = Math.min(effectivePageWidth / imgWidth, effectivePageHeight / imgHeight);
            
            const width = imgWidth * ratio;
            const height = imgHeight * ratio;
            
            const x = marginValue + (effectivePageWidth - width) / 2;
            const y = marginValue + (effectivePageHeight - height) / 2;

            doc.addImage(img, 'PNG', x, y, width, height);
        }
        
        const pdfBlob = doc.output('blob');
        const downloadUrl = URL.createObjectURL(pdfBlob);
        
        toast({
            title: "Conversion Successful!",
            description: `Your PDF "${pdfName}.pdf" is ready.`,
            variant: "default",
            duration: 10000,
            className: "bg-accent text-accent-foreground border-accent",
            action: (
              <Button variant="outline" size="sm" onClick={() => {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${pdfName}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
              }}
              className="bg-accent-foreground text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Download
              </Button>
            ),
          });

    } catch (error) {
        console.error("PDF conversion failed:", error);
        toast({
            title: "Conversion Failed",
            description: "An error occurred while creating the PDF.",
            variant: "destructive",
        });
    } finally {
        setIsConverting(false);
    }
  };

  const handleSort = (sortType: string) => {
    if (!sortType) return;
    const [sortBy, order] = sortType.split('-');
    const sortedImages = [...images].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
            comparison = a.file.name.localeCompare(b.file.name);
        } else if (sortBy === 'date') {
            comparison = a.file.lastModified - b.file.lastModified;
        } else if (sortBy === 'created') {
            // Note: 'created' time is often not available, falls back to lastModified
            comparison = (a.file as any).birthtimeMs || a.file.lastModified - ((b.file as any).birthtimeMs || b.file.lastModified);
        }


        return order === 'asc' ? comparison : -comparison;
    });
    setImages(sortedImages);
  };
  
  useEffect(() => {
    // Cleanup object URLs on unmount
    return () => {
        images.forEach(image => URL.revokeObjectURL(image.preview));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto max-w-7xl">
        <PageHeader 
          title="Image to PDF Converter"
          description="Upload your images, reorder them by dragging, and combine them into a single, high-quality PDF document."
        />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Your Images</CardTitle>
                        <CardDescription>Click to upload or drag & drop. Drag images to reorder.</CardDescription>
                    </div>
                     {images.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={clearAllImages}>
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Clear all
                        </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <label
                    htmlFor="image-upload"
                    className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary hover:bg-muted"
                  >
                    <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
                    <span className="font-semibold text-primary">Click to upload</span>
                    <span className="text-sm text-muted-foreground">or drag and drop images here</span>
                    <input id="image-upload" ref={fileInputRef} type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
                  </label>
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {images.map((image, index) => (
                        <ImageCard 
                          key={image.id}
                          index={index}
                          image={image}
                          moveImage={moveImage}
                          removeImage={removeImage}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="pdf-name">PDF Filename</Label>
                  <Input id="pdf-name" value={pdfName} onChange={(e) => setPdfName(e.target.value)} placeholder="e.g., my-album"/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="page-size">Page Size</Label>
                  <Select value={pageSize} onValueChange={setPageSize}>
                    <SelectTrigger id="page-size">
                      <SelectValue placeholder="Select page size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4 (210 x 297 mm)</SelectItem>
                      <SelectItem value="letter">Letter (8.5 x 11 in)</SelectItem>
                      <SelectItem value="a3">A3 (297 x 420 mm)</SelectItem>
                      <SelectItem value="a5">A5 (148 x 210 mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="page-orientation">Page Orientation</Label>
                    <Select value={orientation} onValueChange={(v) => setOrientation(v as PageOrientation)}>
                      <SelectTrigger id="page-orientation">
                        <SelectValue placeholder="Select orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (by image ratio)</SelectItem>
                        <SelectItem value="p">Portrait</SelectItem>
                        <SelectItem value="l">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                <div className="grid gap-2">
                  <Label htmlFor="page-margin">Page Margin</Label>
                  <Select value={pageMargin} onValueChange={(v) => setPageMargin(v as PageMargin)}>
                      <SelectTrigger id="page-margin">
                        <SelectValue placeholder="Select margin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="normal">Normal (1")</SelectItem>
                        <SelectItem value="narrow">Narrow (0.5")</SelectItem>
                        <SelectItem value="wide">Wide (2")</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="sort-order">Sort Images</Label>
                    <Select onValueChange={handleSort}>
                      <SelectTrigger id="sort-order">
                        <SelectValue placeholder="Select sorting order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Filename (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Filename (Z-A)</SelectItem>
                        <SelectItem value="date-asc">Date Modified (Oldest)</SelectItem>
                        <SelectItem value="date-desc">Date Modified (Newest)</SelectItem>
                        <SelectItem value="created-asc">Date Created (Oldest)</SelectItem>
                        <SelectItem value="created-desc">Date Created (Newest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                <Button onClick={handleConvert} disabled={isConverting || images.length === 0} className="w-full">
                  {isConverting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Convert to PDF ({images.length})
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

    