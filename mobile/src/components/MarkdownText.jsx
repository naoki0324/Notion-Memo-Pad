import React from 'react';
import { Text, View } from 'react-native';

const MarkdownText = ({ content, style }) => {
  if (!content) return null;

  const lines = content.split('\n');
  
  // Function to parse inline markdown (bold, italic, code, strikethrough)
  const parseInlineMarkdown = (text, baseStyle) => {
    const parts = [];
    let partIndex = 0;
    
    // Regex patterns for inline markdown
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, style: { fontWeight: '700' } }, // Bold
      { regex: /\*(.+?)\*/g, style: { fontStyle: 'italic' } },   // Italic
      { regex: /`(.+?)`/g, style: { fontFamily: 'monospace', backgroundColor: '#F3F4F6', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 } }, // Code
      { regex: /~~(.+?)~~/g, style: { textDecorationLine: 'line-through', opacity: 0.7 } }, // Strikethrough
    ];
    
    const matches = [];
    
    // Find all matches
    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          style: pattern.style,
          fullMatch: match[0]
        });
      }
      pattern.regex.lastIndex = 0;
    });
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // If no matches, return plain text
    if (matches.length === 0) {
      return <Text key={partIndex} style={baseStyle}>{text}</Text>;
    }
    
    // Process matches
    let lastEnd = 0;
    matches.forEach((match, index) => {
      // Add text before match
      if (match.start > lastEnd) {
        parts.push(
          <Text key={`text-${partIndex++}`} style={baseStyle}>
            {text.substring(lastEnd, match.start)}
          </Text>
        );
      }
      
      // Add styled match
      parts.push(
        <Text key={`styled-${partIndex++}`} style={[baseStyle, match.style]}>
          {match.content}
        </Text>
      );
      
      lastEnd = match.end;
    });
    
    // Add remaining text
    if (lastEnd < text.length) {
      parts.push(
        <Text key={`remaining-${partIndex++}`} style={baseStyle}>
          {text.substring(lastEnd)}
        </Text>
      );
    }
    
    return parts;
  };
  
  const renderLine = (line, index) => {
    const trimmedLine = line.trim();
    const baseStyle = style || { color: '#111318', fontSize: 16, lineHeight: 24 };
    
    // Handle headings
    if (trimmedLine.startsWith('### ')) {
      const content = trimmedLine.replace('### ', '');
      return (
        <Text key={index} style={[baseStyle, { fontSize: 18, fontWeight: '600', marginVertical: 8, color: '#374151' }]}>
          {parseInlineMarkdown(content, [baseStyle, { fontSize: 18, fontWeight: '600', color: '#374151' }])}
        </Text>
      );
    }
    
    if (trimmedLine.startsWith('## ')) {
      const content = trimmedLine.replace('## ', '');
      return (
        <Text key={index} style={[baseStyle, { fontSize: 20, fontWeight: '700', marginVertical: 10, color: '#1F2937' }]}>
          {parseInlineMarkdown(content, [baseStyle, { fontSize: 20, fontWeight: '700', color: '#1F2937' }])}
        </Text>
      );
    }
    
    if (trimmedLine.startsWith('# ')) {
      const content = trimmedLine.replace('# ', '');
      return (
        <Text key={index} style={[baseStyle, { fontSize: 24, fontWeight: '800', marginVertical: 12, color: '#111318' }]}>
          {parseInlineMarkdown(content, [baseStyle, { fontSize: 24, fontWeight: '800', color: '#111318' }])}
        </Text>
      );
    }
    
    // Handle numbered lists
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      const content = numberedMatch[2];
      return (
        <Text key={index} style={[baseStyle, { marginVertical: 2, marginLeft: 0 }]}>
          <Text style={{ fontWeight: '600', color: '#6B7280' }}>{numberedMatch[1]}. </Text>
          {parseInlineMarkdown(content, baseStyle)}
        </Text>
      );
    }
    
    // Handle nested bullet points (support up to 2 levels)
    if (trimmedLine.startsWith('  - ')) {
      const content = trimmedLine.replace('  - ', '');
      return (
        <Text key={index} style={[baseStyle, { marginVertical: 2, marginLeft: 20 }]}>
          <Text style={{ color: '#9CA3AF' }}>◦ </Text>
          {parseInlineMarkdown(content, baseStyle)}
        </Text>
      );
    }
    
    // Handle regular bullet points
    if (trimmedLine.startsWith('- ')) {
      const content = trimmedLine.replace('- ', '');
      return (
        <Text key={index} style={[baseStyle, { marginVertical: 2 }]}>
          <Text style={{ color: '#6B7280', fontWeight: '600' }}>• </Text>
          {parseInlineMarkdown(content, baseStyle)}
        </Text>
      );
    }
    
    // Handle blockquotes
    if (trimmedLine.startsWith('> ')) {
      const content = trimmedLine.replace('> ', '');
      return (
        <View key={index} style={{ 
          borderLeftWidth: 4, 
          borderLeftColor: '#D1D5DB', 
          paddingLeft: 12, 
          marginVertical: 4 
        }}>
          <Text style={[baseStyle, { color: '#6B7280', fontStyle: 'italic' }]}>
            {parseInlineMarkdown(content, [baseStyle, { color: '#6B7280', fontStyle: 'italic' }])}
          </Text>
        </View>
      );
    }
    
    // Empty line
    if (trimmedLine === '') {
      return (
        <Text key={index} style={[baseStyle, { height: 8 }]}>
          {'\n'}
        </Text>
      );
    }
    
    // Regular text with inline markdown
    return (
      <Text key={index} style={[baseStyle, { marginVertical: 2 }]}>
        {parseInlineMarkdown(line, baseStyle)}
      </Text>
    );
  };

  return (
    <View>
      {lines.map(renderLine)}
    </View>
  );
};

export default MarkdownText;