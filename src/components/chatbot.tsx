import React, { useState, useEffect, useRef } from "react";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { extract } from '@extractus/article-extractor';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import ReactMarkdown from 'react-markdown';

import constants from "../constants";

type Message = {
  text: string;
  sender: "user" | "bot";
};

interface ChatbotProps {
  contentUrl: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ contentUrl }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWebpage, setIsLoadingWebpage] = useState(false);
  const [hasFetchedSummary, setHasFetchedSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ctrl = new AbortController();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (hasFetchedSummary) return;

      setHasFetchedSummary(true);
      try {
        setIsLoading(true);
        setIsLoadingWebpage(true);
        setMessages([{ text: "Loading webpage...", sender: "bot" }]);
        
        const html = await extract(contentUrl);
        console.log(html);
        setIsLoadingWebpage(false);
        
        let summary = "";

        await fetchEventSource(`${constants.API_URL}/summarize-html`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
          },
          body: JSON.stringify({ html }),
          signal: ctrl.signal,
          onopen: async (response: any) => {
            summary = "";
          },
          onmessage: async (event: any) => {
            let data = JSON.parse(event.data);
            summary += data.text;
            setMessages([{ text: summary, sender: "bot" }]);
          },
          onerror: (error: any) => {
            console.error("Error:", error);
            setMessages([{ text: "Sorry, an error occurred while getting the summary.", sender: "bot" }]);
          },
          onclose: () => {
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error(err);
        setMessages([{ text: "Sorry, an error occurred while getting the summary.", sender: "bot" }]);
        setIsLoading(false);
        setIsLoadingWebpage(false);
      }
    };

    fetchSummary();

    return () => {
      ctrl.abort();
    };
  }, [contentUrl, hasFetchedSummary]);

  const sendMessage = async () => {
    if (input.trim() && !isLoading) {
      const newUserMessage: Message = { text: input, sender: "user" };
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      setInput("");
      setIsLoading(true);
      setIsLoadingWebpage(true);

      try {
        setMessages(prevMessages => [...prevMessages, { text: "Loading webpage...", sender: "bot" }]);
        const html = await extract(contentUrl);
        setIsLoadingWebpage(false);
        
        let response = "";

        await fetchEventSource(`${constants.API_URL}/summarize-html`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
          },
          body: JSON.stringify({ html }),
          signal: ctrl.signal,
          onopen: async () => {
            response = "";
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              newMessages[newMessages.length - 1] = { text: "", sender: "bot" };
              return newMessages;
            });
          },
          onmessage: async (event: any) => {
            let data = JSON.parse(event.data);
            response += data.text;
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              newMessages[newMessages.length - 1] = { text: response, sender: "bot" };
              return newMessages;
            });
          },
          onerror: (error: any) => {
            console.error("Error:", error);
            setMessages(prevMessages => [...prevMessages, { text: "Sorry, an error occurred. Please try again later.", sender: "bot" }]);
          },
          onclose: () => {
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error(err);
        setMessages(prevMessages => [...prevMessages, { text: "Sorry, an error occurred. Please try again later.", sender: "bot" }]);
        setIsLoading(false);
        setIsLoadingWebpage(false);
      }
    }
  };

  return (
    <Box sx={{
      width:'100%',
      height: '100%',
      margin: 0,
      padding: 0,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{
        flexGrow: 1,
        overflowY: "auto",
        padding: 2,
      }}>
        {messages.map((message, index) => (
          <Box key={index} sx={{
            marginBottom: 1,
            textAlign: message.sender === "user" ? "right" : "left"
          }}>
            <Typography 
              component="div" 
              sx={{
                display: 'inline-block',
                padding: 1,
                borderRadius: 1,
                backgroundColor: message.sender === "user" ? "#e3f2fd" : "#f5f5f5",
                maxWidth: '70%'
              }}
            >
              <ReactMarkdown>{message.text}</ReactMarkdown>
              {isLoadingWebpage && message.sender === "bot" && index === messages.length - 1 && (
                <CircularProgress size={20} sx={{ marginLeft: 1 }} />
              )}
            </Typography>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{
        height: '60px',
        borderTop: 1,
        width: '100%',
        backgroundColor: '#fff',
        borderColor: 'divider',
        padding: 1
      }}>
        <Box sx={{
          height: '100%',
          display: "flex",
          alignItems: 'center',
          flexDirection: "row",
        }}>
          <TextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                e.preventDefault();
                sendMessage();
              }
            }}
            sx={{ flexGrow: 1, marginRight: 1 }}
            size="small"
            label="Enter message"
            variant="outlined"
            disabled={isLoading}
          />
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            onClick={sendMessage}
            disabled={isLoading}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Chatbot;
