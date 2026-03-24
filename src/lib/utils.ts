import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ParsedMessage {
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  isMedia: boolean;
}

export function parseMessageContent(message: any): ParsedMessage {
  const result: ParsedMessage = { text: '', isMedia: false };

  if (!message) {
    result.text = '[Mídia]';
    result.isMedia = true;
    return result;
  }

  // Helper to parse if string looks like JSON
  const tryParse = (val: any) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          return JSON.parse(trimmed);
        } catch (e) {}
      }
    }
    return val;
  };

  // Multi-level parsing (handles double stringification)
  let data = tryParse(message);
  if (typeof data === 'object' && data !== null) {
     // If it's a LangChain/AIMessage format, try to unwrap it further
     if (data.message) data = tryParse(data.message);
     if (typeof data === 'object' && data !== null && data.content !== undefined) {
         // Keep unwrapped data
     }
  }

  // Force object structure
  if (typeof data !== 'object' || data === null) {
    data = { content: String(data) };
  }

  // 1. Text extraction - Search through common keys for a string or array
  let rawText = data.content ?? data.output ?? data.text ?? data.message ?? data.body ?? "";
  
  // If rawText itself is stringified JSON, parse it
  rawText = tryParse(rawText);

  // If rawText is an object, try to find a string property
  if (typeof rawText === 'object' && rawText !== null && !Array.isArray(rawText)) {
    rawText = rawText.text || rawText.content || rawText.body || JSON.stringify(rawText);
  }

  if (Array.isArray(rawText)) {
    result.text = rawText
      .map((block: any) => block?.text || block?.content || block?.body || '')
      .filter(Boolean)
      .join('\n');
  } else {
    result.text = String(rawText || '');
  }

  // Sanity check: if we somehow ended up with the whole original object as a string, something is wrong
  // (This happens if rawText was the entire data object and we stringified it)
  if (result.text.includes('"content":') && result.text.includes('"type":')) {
      try {
          const secondChance = JSON.parse(result.text);
          result.text = secondChance.content || secondChance.text || secondChance.body || result.text;
      } catch(e) {}
  }

  // 2. Media extraction (Tintim / Evolution / WhatsApp patterns)
  // Broaden the search for URLs
  const mediaUrl = data.mediaUrl || data.url || data.fileUrl || data.image_url || data.link ||
                   data.additional_kwargs?.media_url || data.additional_kwargs?.url || 
                   data.additional_kwargs?.image || data.additional_kwargs?.video || data.additional_kwargs?.audio;
                   
  const mimeType = data.mimeType || data.mimetype || data.additional_kwargs?.mimetype || data.additional_kwargs?.contentType;

  if (mediaUrl && typeof mediaUrl === 'string') {
    result.mediaUrl = mediaUrl;
    result.isMedia = true;
    
    const urlLower = mediaUrl.toLowerCase();
    if (mimeType && typeof mimeType === 'string') {
      if (mimeType.startsWith('image/')) result.mediaType = 'image';
      else if (mimeType.startsWith('video/')) result.mediaType = 'video';
      else if (mimeType.startsWith('audio/')) result.mediaType = 'audio';
      else result.mediaType = 'document';
    } else {
      // Guess from extension
      if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)/)) result.mediaType = 'image';
      else if (urlLower.match(/\.(mp4|webm|ogg|mov)/)) result.mediaType = 'video';
      else if (urlLower.match(/\.(mp3|wav|ogg|m4a|aac)/)) result.mediaType = 'audio';
      else result.mediaType = 'document';
    }
  }

  // Force placeholder if still empty
  if (!result.text.trim() && !result.mediaUrl) {
    result.text = '[Mídia]';
  } else if (!result.text.trim() && result.isMedia) {
    result.text = '[Mídia]';
  }

  // Strip tool call prefix
  if (result.text.startsWith('[Used tools:')) {
    let depth = 0;
    for (let i = 0; i < result.text.length; i++) {
      if (result.text[i] === '[') depth++;
      else if (result.text[i] === ']') {
        depth--;
        if (depth === 0) {
          result.text = result.text.slice(i + 1).trimStart();
          break;
        }
      }
    }
  }

  return result;
}
