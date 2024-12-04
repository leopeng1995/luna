import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';
import Button from "@mui/material/Button";
import Alert from '@mui/material/Alert';

interface RewriteContentProps {
  activeTab: string;
  initialContent: string;
}

const RewriteContent: React.FC<RewriteContentProps> = ({ activeTab, initialContent }) => {
  const [inputContent, setInputContent] = useState("");
  const [outputContent, setOutputContent] = useState("Rewritten content will be displayed here...");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  useEffect(() => {
    setInputContent(initialContent);
  }, [initialContent]);

  const handleRewrite = async () => {
    if (!inputContent.trim()) {
      setError("Please enter content");
      return;
    }

    setIsRewriting(true);
    setError(null);
    setOutputContent("Rewriting...");

    try {
      if (!window.ai?.languageModel) {
        setError("API not available");
        return;
      }

      const capabilities = await window.ai.languageModel.capabilities();
      if (capabilities.available === "no") {
        setError("Feature not available - please check browser settings");
        return;
      }

      const rewriter = await window.ai.rewriter.create({
        sharedContext: "Please rewrite the content in a different way while maintaining the same meaning"
      });

      const stream = rewriter.rewriteStreaming(inputContent, {
        context: "Avoid any toxic language and be as constructive as possible."
      });

      let generatedText = '';
      let previousChunk = '';

      for await (const chunk of stream) {
        const newChunk = chunk.startsWith(previousChunk)
          ? chunk.slice(previousChunk.length)
          : chunk;
        generatedText += newChunk;
        setOutputContent(generatedText);
        previousChunk = chunk;
      }

      rewriter.destroy();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rewriting failed");
      setOutputContent("Unable to rewrite content.");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(outputContent).then(() => {
      setSnackbarOpen(true);
    });
  };

  const handleSnackbarClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (activeTab !== 'rewrite') return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        multiline
        rows={3}
        value={inputContent}
        onChange={(e) => setInputContent(e.target.value)}
        variant="outlined"
        label="Original Content"
        placeholder="Content to be rewritten..."
      />
      
      <Button
        onClick={handleRewrite}
        variant="contained"
        color="primary"
        disabled={isRewriting}
        sx={{ alignSelf: 'flex-start' }}
      >
        {isRewriting ? 'Rewriting...' : 'Rewrite'}
      </Button>

      <TextField
        fullWidth
        multiline
        rows={5}
        value={outputContent}
        variant="outlined"
        label="Generated Result"
        InputProps={{
          readOnly: true,
        }}
      />

      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      <Button
        startIcon={<ContentCopyIcon />}
        onClick={handleCopyClick}
        size="small"
        sx={{ alignSelf: 'flex-end' }}
      >
        Copy
      </Button>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="Copied to clipboard"
      />
    </Box>
  );
};

export default RewriteContent;
