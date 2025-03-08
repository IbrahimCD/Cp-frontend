import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  CircularProgress, 
  Link, 
  List, 
  ListItem, 
  ListItemText, 
  ToggleButton, 
  ToggleButtonGroup, 
  Grow, 
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { jsPDF } from 'jspdf';

function App() {
  // Mode: 'normal' (future track mode can be added)
  const [mode, setMode] = useState('normal');

  // Normal mode states:
  const [normalFiles, setNormalFiles] = useState([]);
  const [normalDownloadUrl, setNormalDownloadUrl] = useState('');
  const [normalLoading, setNormalLoading] = useState(false);
  const [normalError, setNormalError] = useState('');
  const [normalTimer, setNormalTimer] = useState(0);
  const [pdfName, setPdfName] = useState(''); // for custom PDF file name

  // Info dialog state
  const [openInfo, setOpenInfo] = useState(false);

  // Timer effect for normal mode loading
  useEffect(() => {
    let interval = null;
    if (mode === 'normal' && normalLoading) {
      setNormalTimer(0);
      interval = setInterval(() => setNormalTimer(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [normalLoading, mode]);

  // Toggle mode handler (for future expansion)
  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
      // Reset normal mode state when switching modes
      setNormalFiles([]);
      setNormalDownloadUrl('');
      setNormalError('');
      setPdfName('');
    }
  };

  // Normal mode: useDropzone for file/folder selection.
  const onNormalDrop = useCallback((acceptedFiles) => {
    setNormalFiles(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onNormalDrop,
    multiple: true,
  });

  // Handle upload for Normal mode.
  const handleNormalUpload = async (e) => {
    e.preventDefault();
    if (normalFiles.length === 0) {
      setNormalError('Please drop file(s) or folder(s) to upload.');
      return;
    }
    setNormalError('');
    setNormalLoading(true);
    setNormalDownloadUrl('');

    const formData = new FormData();
    normalFiles.forEach(file => {
      formData.append('fileUpload', file);
    });

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errMsg = await response.json();
        setNormalError(errMsg.error || 'Upload failed');
      } else {
        const data = await response.json();
        setNormalDownloadUrl(data.downloadUrl);
      }
    } catch (err) {
      setNormalError('Error: ' + err.message);
    } finally {
      setNormalLoading(false);
    }
  };

  // Updated PDF download function:
  // Title is printed in a larger font while the content is printed in a smaller font with reduced line height.
  const handleDownloadPDF = async () => {
    if (!normalDownloadUrl) return;
    try {
      const response = await fetch(`http://localhost:3001${normalDownloadUrl}`);
      const text = await response.text();

      const doc = new jsPDF();
      // Title in larger font
      doc.setFontSize(16);
      doc.text("Combined Output", 10, 20);

      // Set font for content
      doc.setFontSize(8);
      const margin = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxLineWidth = pageWidth - margin * 2;
      // Trim extra whitespace and split text
      const lines = doc.splitTextToSize(text, maxLineWidth).map(line => line.trim());
      
      let y = 30; // Start after the title
      const lineHeight = 7; // Reduced line height
      lines.forEach((line) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      const fileName = pdfName ? pdfName : "output.pdf";
      const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : fileName + '.pdf';
      doc.save(finalFileName);
    } catch (err) {
      alert("Error generating PDF: " + err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{
      mt: 4,
      mb: 4,
      p: 4,
      borderRadius: '16px',
      background: '#fdf6e3',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      fontFamily: '"Times New Roman", Times, serif',
      position: 'relative'
    }}>
      {/* Info Button */}
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <IconButton onClick={() => setOpenInfo(true)} color="primary">
          <InfoIcon />
        </IconButton>
      </Box>

      {/* Info Dialog */}
      <Dialog open={openInfo} onClose={() => setOpenInfo(false)}>
        <DialogTitle>How to Use Striver Pasting Service</DialogTitle>
        <DialogContent>
          <DialogContentText>
            1. Drag & drop your files or folders into the dropzone or click to select them.
          </DialogContentText>
          <DialogContentText>
            2. Once selected, click "Upload and Process" to combine your code.
          </DialogContentText>
          <DialogContentText>
            3. After processing, download the combined text or choose to download it as a PDF.
          </DialogContentText>
          <DialogContentText>
            Enjoy the classic elegance and unexpected brilliance of our service!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInfo(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Grow in timeout={1000}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h2" component="h1" sx={{
            fontWeight: 'bold',
            color: '#6b4f4f',
            textShadow: '1px 1px 3px rgba(0,0,0,0.3)'
          }}>
            Striver Pasting Service
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#7e6651', mt: 1 }}>
            Classic elegance meets modern functionality.
          </Typography>
        </Box>
      </Grow>

      <ToggleButtonGroup
        color="primary"
        value={mode}
        exclusive
        onChange={handleModeChange}
        sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}
      >
        <ToggleButton value="normal" sx={{ fontFamily: '"Times New Roman", serif' }}>Normal Upload</ToggleButton>
      </ToggleButtonGroup>

      {mode === 'normal' && (
        <>
          <Grow in timeout={1500}>
            <Typography variant="body1" gutterBottom align="center" sx={{ fontSize: '1.1rem', color: '#5c4e4e' }}>
              Drag & drop files/folders here, or click to select.
            </Typography>
          </Grow>
          <Grow in timeout={2000}>
            <Paper
              {...getRootProps()}
              elevation={3}
              sx={{
                border: '3px dashed #6b4f4f',
                borderRadius: '16px',
                p: 4,
                textAlign: 'center',
                mb: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease, transform 0.3s ease',
                '&:hover': { backgroundColor: '#f4e1d2', transform: 'scale(1.02)' }
              }}
            >
              <input {...getInputProps()} webkitdirectory="true" directory="true" multiple />
              {isDragActive ? (
                <Typography variant="h6" sx={{ color: '#6b4f4f' }}>
                  Drop the files/folders here...
                </Typography>
              ) : (
                <Typography variant="h6" sx={{ color: '#6b4f4f' }}>
                  Drag & drop files/folders here, or click to select.
                </Typography>
              )}
            </Paper>
          </Grow>

          {normalFiles.length > 0 && (
            <Grow in timeout={2500}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#6b4f4f' }}>Selected Files:</Typography>
                <List>
                  {normalFiles.map((file, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={file.name}
                        secondary={file.webkitRelativePath ? file.webkitRelativePath : 'No folder path'}
                        primaryTypographyProps={{ sx: { fontFamily: '"Times New Roman", serif', color: '#4a3f3f' } }}
                        secondaryTypographyProps={{ sx: { fontFamily: '"Times New Roman", serif', color: '#5c4e4e' } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grow>
          )}

          <Grow in timeout={3000}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Button variant="contained" color="primary" onClick={handleNormalUpload} disabled={normalLoading} sx={{
                px: 4, py: 1, fontSize: '1.1rem',
                fontFamily: '"Times New Roman", serif'
              }}>
                {normalLoading ? 'Uploading...' : 'Upload and Process'}
              </Button>
            </Box>
          </Grow>

          {normalLoading && (
            <Grow in timeout={3500}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography variant="body1" sx={{ fontFamily: '"Times New Roman", serif' }}>
                  Processing... {normalTimer} s
                </Typography>
              </Box>
            </Grow>
          )}

          {normalError && (
            <Grow in timeout={3500}>
              <Typography color="error" align="center" gutterBottom sx={{ fontFamily: '"Times New Roman", serif' }}>
                {normalError}
              </Typography>
            </Grow>
          )}

          {normalDownloadUrl && (
            <Grow in timeout={4000}>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#6b4f4f', fontFamily: '"Times New Roman", serif' }}>
                  Processing complete! WOW! Your masterpiece is ready!
                </Typography>
                <Link href={`http://localhost:3001${normalDownloadUrl}`} target="_blank" rel="noopener" sx={{
                  display: 'block', mb: 2, fontFamily: '"Times New Roman", serif', color: '#6b4f4f'
                }}>
                  Download Combined Output (Text)
                </Link>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom sx={{ fontFamily: '"Times New Roman", serif', color: '#6b4f4f' }}>
                    Enter a name for the PDF:
                  </Typography>
                  <input 
                    type="text" 
                    placeholder="e.g., myoutput.pdf"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    style={{ 
                      padding: '8px', 
                      width: '100%', 
                      marginBottom: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc', 
                      fontFamily: '"Times New Roman", serif'
                    }}
                  />
                  <Button variant="contained" color="secondary" onClick={handleDownloadPDF} sx={{
                    px: 4, py: 1, fontSize: '1.1rem',
                    fontFamily: '"Times New Roman", serif'
                  }}>
                    Download as PDF
                  </Button>
                </Box>
              </Box>
            </Grow>
          )}
        </>
      )}
    </Container>
  );
}

export default App;
