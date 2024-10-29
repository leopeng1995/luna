import React, { CSSProperties, useState, memo } from "react";
import { Tabs, Tab, Typography, Box, SvgIcon } from '@mui/material';
import { useTheme } from "@mui/material/styles";
import { SvgIconProps } from '@mui/material/SvgIcon';

import Chatbot from "./chatbot";
import MindMapSummary from "./mindmap";

const CloseIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
  </SvgIcon>
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  const tabPanelStyle: CSSProperties = {
    padding: 0,
    flexGrow: 1,
    width: "100%",
    overflow: 'hidden' 
  };

  return (
    <div
      style={tabPanelStyle}
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Typography sx={{ padding: 0, height: "100%", overflow: 'hidden', width: "100%" }}>
          {children}
        </Typography>
      )}
    </div>
  );
};

const a11yProps = (index: number) => ({
  id: `simple-tab-${index}`,
  'aria-controls': `simple-tabpanel-${index}`,
});

interface ChatPopupProps {
  contentUrl: string;
  onClose: () => void;
}

const POPUP_WIDTH = 350;
const POPUP_HEIGHT = 450;

const ChatPopup: React.FC<ChatPopupProps> = memo(({ contentUrl, onClose }) => {
  const [value, setValue] = useState(0);
  const theme = useTheme();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{
      position: "fixed",
      bottom: theme.spacing(2.5),
      right: theme.spacing(2.5),
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#fff",
      boxShadow: theme.shadows[5],
      width: POPUP_WIDTH,
      height: POPUP_HEIGHT,
      zIndex: 1000,
      overflow: 'hidden' 
    }}>
      <Box sx={{
        borderBottom: 1,
        borderColor: 'divider',
        alignItems: "center",
        flexDirection: "row",
        display: "flex"
      }}>
        <Tabs sx={{ flexGrow: 1 }} value={value} onChange={handleChange}>
          <Tab label="网页对话" {...a11yProps(0)} />
          <Tab label="脑图总结" {...a11yProps(1)} />
        </Tabs>
        <CloseIcon onClick={onClose} sx={{ width: 20, marginRight: theme.spacing(1.25) }} />
      </Box>
      <CustomTabPanel value={value} index={0}>
        <Chatbot contentUrl={contentUrl} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <MindMapSummary contentUrl={contentUrl} />
      </CustomTabPanel>
    </Box>
  );
});

export default ChatPopup;
