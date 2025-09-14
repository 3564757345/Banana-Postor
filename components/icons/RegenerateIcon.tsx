
import React from 'react';

export const RegenerateIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className || "h-5 w-5"}
    >
        <path d="M12 3c.3 0 .5.1.8.2l4.2 2.1c.5.3.8.8.8 1.4v8.6c0 .6-.3 1.1-.8 1.4l-4.2 2.1c-.3.1-.5.2-.8.2s-.5-.1-.8-.2l-4.2-2.1c-.5-.3-.8-.8-.8-1.4V6.7c0-.6.3-1.1.8-1.4l4.2-2.1c.3-.1.5-.2.8-.2z"/>
        <path d="M12 3v18"/>
        <path d="M22 6l-5.1 2.6"/>
        <path d="M2 6l5.1 2.6"/>
        <path d="m22 18-5.1-2.6"/>
        <path d="m2 18 5.1-2.6"/>
    </svg>
);
