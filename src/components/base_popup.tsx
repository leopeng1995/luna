import React, { useState, useEffect, useRef } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import ButtonGroup from '@mui/material/ButtonGroup';
import TranslateIcon from '@mui/icons-material/Translate';
import CodeIcon from '@mui/icons-material/Code';
import EditIcon from '@mui/icons-material/Edit';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface BasePopupProps {
  content: string;
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

const BasePopup: React.FC<BasePopupProps> = ({
  content,
  x,
  y,
  onClose,
  children
}) => {
  const [position, setPosition] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('translate');

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose, popupRef]);

  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width;
      }
      if (y + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height;
      }
      if (newX < 0) {
        newX = 0;
      }
      if (newY < 0) {
        newY = 0;
      }

      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    });
    setIsDragging(true);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <Card
      ref={popupRef}
      sx={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: 600,
        height: 430,
        maxHeight: 430,
        overflow: "hidden",
        boxShadow: theme.shadows[5],
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      <CardContent sx={{ overflowY: "auto", flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
          <ButtonGroup variant="contained" aria-label="outlined primary button group">
            <Button 
              onClick={() => setActiveTab('translate')}
              variant={activeTab === 'translate' ? 'contained' : 'outlined'}
              title="Text Translation"
            >
              <TranslateIcon />
            </Button>
            <Button 
              onClick={() => setActiveTab('explain')}
              variant={activeTab === 'explain' ? 'contained' : 'outlined'}
              title="Code Explanation"
            >
              <CodeIcon />
            </Button>
            <Button 
              onClick={() => setActiveTab('write')}
              variant={activeTab === 'write' ? 'contained' : 'outlined'}
              title="Write"
            >
              <EditIcon />
            </Button>
            <Button 
              onClick={() => setActiveTab('rewrite')}
              variant={activeTab === 'rewrite' ? 'contained' : 'outlined'}
              title="Rewrite"
            >
              <AutoFixHighIcon />
            </Button>
          </ButtonGroup>
        </Box>
        {React.Children.map(children, child =>
          React.isValidElement(child) 
            ? React.cloneElement(child as React.ReactElement<any>, { activeTab })
            : child
        )}
      </CardContent>
    </Card>
  );
};

export default BasePopup;
