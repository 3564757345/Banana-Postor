
import React, { useRef, useEffect, useState } from 'react';

interface CanvasEditorProps {
  imageUrl: string;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ imageUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const drawImage = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const image = new Image();
    image.crossOrigin = 'anonymous'; // Handle potential CORS issues if images are from a different origin
    image.src = imageUrl;
    image.onload = () => {
      // Maintain aspect ratio
      const hRatio = canvas.width / image.width;
      const vRatio = canvas.height / image.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShift_x = (canvas.width - image.width * ratio) / 2;
      const centerShift_y = (canvas.height - image.height * ratio) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        centerShift_x,
        centerShift_y,
        image.width * ratio,
        image.height * ratio
      );
    };
    image.onerror = () => {
        console.error("Failed to load image on canvas.");
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    drawImage(context, canvas);
  }, [imageUrl]);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event) {
        return {
            x: event.touches[0].clientX - rect.left,
            y: event.touches[0].clientY - rect.top,
        };
    }
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(event);
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;
    const { x, y } = getCoordinates(event);
    context.lineTo(x, y);
    context.strokeStyle = 'rgba(255, 150, 172, 0.7)'; // brand-pink with transparency
    context.lineWidth = 15;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={450}
      height={300}
      className="w-full h-auto bg-gray-900 rounded-md cursor-crosshair"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
};

export default CanvasEditor;
