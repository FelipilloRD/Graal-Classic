import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EventBus } from '../game/EventBus.js';
import './DialogBox.css';

export function DialogBox() {
  const [visible, setVisible] = useState(false);
  const [npcName, setNpcName] = useState('');
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef(null);
  const fullTextRef = useRef('');

  const startTypewriter = useCallback((text) => {
    fullTextRef.current = text;
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      i++;
      if (i <= text.length) {
        setDisplayedText(text.substring(0, i));
      } else {
        clearInterval(timerRef.current);
        setIsTyping(false);
      }
    }, 35);
  }, []);

  const handleShowDialog = useCallback((data) => {
    setNpcName(data.npcName);
    setLines(data.lines);
    setCurrentLine(0);
    setVisible(true);
    startTypewriter(data.lines[0]);
  }, [startTypewriter]);

  const advance = useCallback(() => {
    if (isTyping) {
      // Skip to full text
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayedText(fullTextRef.current);
      setIsTyping(false);
      return;
    }
    if (currentLine < lines.length - 1) {
      const next = currentLine + 1;
      setCurrentLine(next);
      startTypewriter(lines[next]);
    } else {
      setVisible(false);
      EventBus.emit('dialog-closed');
    }
  }, [isTyping, currentLine, lines, startTypewriter]);

  useEffect(() => {
    EventBus.on('show-dialog', handleShowDialog);
    return () => EventBus.off('show-dialog', handleShowDialog);
  }, [handleShowDialog]);

  useEffect(() => {
    const handleKey = (e) => {
      if (visible && (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, advance]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (!visible) return null;

  return (
    <div className="dialog-overlay" onClick={advance}>
      <div className="dialog-header">
        <span className="dialog-name">{npcName}</span>
      </div>
      <div className="dialog-text">{displayedText}</div>
      <div className="dialog-continue">
        {isTyping ? '' : (currentLine < lines.length - 1 ? '▼ Continuar' : '✕ Cerrar')}
      </div>
    </div>
  );
}
