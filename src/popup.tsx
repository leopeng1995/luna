import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { 
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper
} from "@mui/material";

const Popup = () => {
  const [apiKey, setApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState("");

  // Load saved API key from local storage
  useEffect(() => {
    chrome.storage.local.get(["apiKey"], function (result) {
      const storedApiKey = result.apiKey || "";
      setApiKey(storedApiKey);
      setSavedApiKey(storedApiKey);
    });
  }, []);

  const saveApiKey = () => {
    chrome.storage.local.set({ apiKey: apiKey }, function () {
      console.log("API Key saved");
      setSavedApiKey(apiKey);
    });
  };

  return (
    <Container maxWidth="sm" sx={{ 
      minWidth: '350px',
      minHeight: '200px',
      padding: '16px'
    }}>
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" component="h1">
            API Key 设置
          </Typography>
          
          {savedApiKey && (
            <Typography variant="body2" color="text.secondary">
              当前 API Key: {savedApiKey}
            </Typography>
          )}

          <TextField
            fullWidth
            label="输入 API Key"
            variant="outlined"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />

          <Button 
            variant="contained" 
            onClick={saveApiKey}
            sx={{ mt: 1 }}
          >
            保存 API Key
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
