import React from "react";
import BasePopup from "./base_popup";
import TranslateContent from "./translate_content";
import ExplainContent from "./explain_content";
import WriteContent from "./write_content";

interface TranslatePopupProps {
  content: string;
  x: number;
  y: number;
  onClose: () => void;
}

const TranslatePopup: React.FC<TranslatePopupProps> = ({
  content,
  x,
  y,
  onClose,
}) => {
  return (
    <BasePopup content={content} x={x} y={y} onClose={onClose}>
      <TranslateContent activeTab="translate" initialContent={content} />
      <ExplainContent activeTab="explain" initialContent={content} />
      <WriteContent activeTab="write" />
    </BasePopup>
  );
};

export default TranslatePopup;
