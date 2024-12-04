import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';
import Button from "@mui/material/Button";
import Alert from '@mui/material/Alert';

interface ExplainContentProps {
  activeTab: string;
  initialContent: string;
}

const ExplainContent: React.FC<ExplainContentProps> = ({ activeTab, initialContent }) => {
  const [sourceContent, setSourceContent] = useState(initialContent);
  const [targetContent, setTargetContent] = useState("Explanation will appear here...");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    if (activeTab === 'explain') {
      explainCode(sourceContent);
    }
  }, [activeTab]);

  const handleSourceContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSourceContent(event.target.value);
  };

  const explainCode = async (code: string) => {
    setIsExplaining(true);
    setError(null);
    setTargetContent("Explaining code...");

    try {
      // Check if AI model is available
      const { available } = await window.ai.languageModel.capabilities();
      
      if (available === "no") {
        throw new Error("AI model is not available");
      }

      // Create AI session
      const session = await window.ai.languageModel.create({
        systemPrompt: "You are a helpful programming assistant. Explain the following code in a clear and concise way, focusing on its main functionality and key components."
      });

      // Construct the prompt
      const prompt = `Please explain this code:\n\n${code}`;

      // Use streaming response to get explanation
      let explanation = '';
      let previousChunk = '';
      
      const stream = session.promptStreaming(prompt);
      for await (const chunk of stream) {
        const newChunk = chunk.startsWith(previousChunk)
          ? chunk.slice(previousChunk.length)
          : chunk;
        explanation += newChunk;
        setTargetContent(explanation);
        previousChunk = chunk;
      }

      // Release session resources
      session.destroy();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to explain code");
      setTargetContent("Failed to generate explanation.");
    } finally {
      setIsExplaining(false);
    }
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
        label="Source Code"
        sx={{ marginBottom: 2 }}
      />
      <TextField
        fullWidth
        multiline
        rows={5}
        value={targetContent}
        variant="outlined"
        label="Explanation"
        slotProps={{
          input: {
            readOnly: true,
          },
        }}
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
        <Button
          onClick={() => explainCode(sourceContent)}
          size="small"
          variant="contained"
          color="primary"
          disabled={isExplaining}
        >
          {isExplaining ? 'Explaining...' : 'Explain'}
        </Button>
        <Button
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyClick}
          size="small"
        >
          Copy
        </Button>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="Copied to clipboard"
      />
    </>
  );
};

export default ExplainContent;
