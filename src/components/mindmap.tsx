import React from 'react';
import { Box, Typography } from '@mui/material';


interface MindMapSummaryProps {
  contentUrl: string;
}


const MindMapSummary: React.FC<MindMapSummaryProps> = ({ contentUrl }) => {
  return (
    <Box sx={{ padding: 2, height: "100%", overflow: 'auto' }}>
      <Typography variant="body1">
        This is where the mind map summary for {contentUrl} will be displayed.
      </Typography>
    </Box>
  );
};

export default MindMapSummary;
