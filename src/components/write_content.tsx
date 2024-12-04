import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';
import Button from "@mui/material/Button";
import Alert from '@mui/material/Alert';

interface WriteContentProps {
  activeTab: string;
}

const WriteContent: React.FC<WriteContentProps> = ({ activeTab }) => {
  const [inputContent, setInputContent] = useState("");
  const [outputContent, setOutputContent] = useState("Generated content will be displayed here...");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(event.target.value);
  };

  const handleWrite = async () => {
    if (!inputContent.trim()) {
      setError("Please enter content");
      return;
    }

    setIsWriting(true);
    setError(null);
    setOutputContent("Generating...");

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

      const writer = await window.ai.writer.create({
        sharedContext: "Please generate professional and formal content",
        tone: "formal",
      });

      const stream = writer.writeStreaming(inputContent);
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

      writer.destroy();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setOutputContent("Unable to generate content.");
    } finally {
      setIsWriting(false);
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

  if (activeTab !== 'write') return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        multiline
        rows={3}
        value={inputContent}
        onChange={handleInputChange}
        variant="outlined"
        label="Input Content"
        placeholder="Please enter the content you want to generate..."
      />
      
      <Button
        onClick={handleWrite}
        variant="contained"
        color="primary"
        disabled={isWriting}
        sx={{ alignSelf: 'flex-start' }}
      >
        {isWriting ? 'Generating...' : 'Generate'}
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

export default WriteContent;
