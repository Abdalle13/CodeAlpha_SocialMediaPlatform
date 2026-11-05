import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Check, Crop } from 'lucide-react';
import { Button } from './Button';

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  aspectRatio = '1:1', // '1:1' | '3:1'
  title = 'Crop Image',
  onCropComplete,
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Handle drag movement
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch support for mobile devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Draw crop preview on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fill background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Calculate dimensions with zoom and pan
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;

    let renderW, renderH;
    if (imgAspect > canvasAspect) {
      renderH = height * zoom;
      renderW = renderH * imgAspect;
    } else {
      renderW = width * zoom;
      renderH = renderW / imgAspect;
    }

    const renderX = (width - renderW) / 2 + pan.x;
    const renderY = (height - renderH) / 2 + pan.y;

    ctx.drawImage(img, renderX, renderY, renderW, renderH);
  }, [zoom, pan]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, zoom, pan, imageSrc]);

  const handleConfirmCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' });
        onCropComplete(file);
        onClose();
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen || !imageSrc) return null;

  const isSquare = aspectRatio === '1:1';
  const canvasWidth = isSquare ? 400 : 600;
  const canvasHeight = isSquare ? 400 : 200;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl text-primary space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-primary">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-secondary hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Canvas container */}
        <div className="flex flex-col items-center justify-center bg-zinc-950 p-2 rounded-xl overflow-hidden border border-border/80">
          <div
            className={`relative overflow-hidden cursor-move ${
              isSquare ? 'rounded-full w-64 h-64 sm:w-72 sm:h-72 ring-4 ring-accent/30' : 'rounded-xl w-full h-44 sm:h-48 ring-2 ring-accent/30'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            Drag to reposition &bull; Adjust zoom below
          </p>
        </div>

        {/* Hidden image element to load natural dimensions */}
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Source"
          className="hidden"
          onLoad={drawCanvas}
        />

        {/* Zoom Slider */}
        <div className="flex items-center gap-3 px-2">
          <ZoomOut className="w-4 h-4 text-secondary shrink-0" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-accent h-1.5 bg-border rounded-lg cursor-pointer"
          />
          <ZoomIn className="w-4 h-4 text-secondary shrink-0" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmCrop}
            className="gap-1.5 text-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Crop</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

