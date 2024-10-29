import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';
import Button from "@mui/material/Button";

interface ExplainContentProps {
  activeTab: string;
  initialContent: string;
}

const ExplainContent: React.FC<ExplainContentProps> = ({ activeTab, initialContent }) => {
  const [sourceContent, setSourceContent] = useState(initialContent);
  const [targetContent, setTargetContent] = useState("Explanation will appear here...");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'explain') {
      explainCode(sourceContent);
    }
  }, [activeTab]);

  const handleSourceContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSourceContent(event.target.value);
  };

  const explainCode = (code: string) => {
    setTargetContent("Explaining code...");
    // 这里添加代码解释的逻辑
    // 可以使用类似 translateText 的方法，但调用不同的 API 端点
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(targetContent).then(() => {
      setSnackbarOpen(true);
    });
  };

  const handleSnackbarClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (activeTab !== 'explain') return null;

  return (
    <>
      <TextField
        fullWidth
        multiline
        rows={3}
        value={sourceContent}
        onChange={handleSourceContentChange}
        variant="outlined"
        label="源代码"
        sx={{ marginBottom: 2 }}
      />
      <TextField
        fullWidth
        multiline
        rows={5}
        value={targetContent}
        variant="outlined"
        label="解释结果"
        slotProps={{
          input: {
            readOnly: true,
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
        <Button
          onClick={() => explainCode(sourceContent)}
          size="small"
          variant="contained"
          color="primary"
        >
          解释
        </Button>
        <Button
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyClick}
          size="small"
        >
          复制
        </Button>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="已复制到剪贴板"
      />
    </>
  );
};

export default ExplainContent;
