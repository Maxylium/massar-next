import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Alert,
  Paper,
  createTheme,
  ThemeProvider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
} from '@mui/material';
import { teal, blue } from '@mui/material/colors';
import axios from 'axios';
import { parseMassarGrades } from '../utils/parseMassarGrades';
import { Chart, registerables } from 'chart.js';

const theme = createTheme({
  palette: {
    primary: { main: blue[700] },
    secondary: { main: teal[500] },
    background: { default: '#f4fafd' },
  },
});

interface FetchGradesForm {
  username: string;
  password: string;
  semester: string;
  year: string;
}

const FetchGrades: React.FC = () => {
  const [form, setForm] = useState<FetchGradesForm>({
    username: '',
    password: '',
    semester: '1',
    year: '2024/2025',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<any>(null);
  const chartRef = React.useRef<HTMLCanvasElement | null>(null);

  const yearOptions = [
    '2015/2016',
    '2016/2017',
    '2017/2018',
    '2018/2019',
    '2019/2020',
    '2020/2021',
    '2021/2022',
    '2022/2023',
    '2023/2024',
    '2024/2025',
  ];
  const semesterOptions = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Moyenne Annuelle' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }> | React.ChangeEvent<HTMLInputElement> | any
  ) => {
    const name = event.target.name as string;
    setForm({ ...form, [name]: event.target.value as string });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setParsed(null);
    try {
      const res = await axios.post('/api/fetch-grades', form);
      setResult(res.data.rawHTML);
      const parsedData = parseMassarGrades(res.data.rawHTML);
      setParsed(parsedData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parsed && chartRef.current && parsed.examRows.length > 0) {
      Chart.register(...registerables);
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;
      // Destroy previous chart instance if exists
      if ((window as any).massarChart) {
        (window as any).massarChart.destroy();
      }
      (window as any).massarChart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: parsed.examRows.map((row: any) => row.matiere),
          datasets: [
            {
                variant="outlined"
                required
                fullWidth
                color="primary"
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleInputChange}
                variant="outlined"
                required
                fullWidth
                color="primary"
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="year-label">Academic Year</InputLabel>
                <Select
                  labelId="year-label"
                  name="year"
                  value={form.year}
                  label="Academic Year"
                  onChange={handleSelectChange}
                  color="secondary"
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="semester-label">Semester</InputLabel>
                <Select
                  labelId="semester-label"
                  name="semester"
                  value={form.semester}
                  label="Semester"
                  onChange={handleSelectChange}
                  color="secondary"
                >
                  {semesterOptions.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                sx={{ mt: 2, borderRadius: 2, fontWeight: 600 }}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Fetch Grades'}
              </Button>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
            )}
            {parsed && (
              <Box sx={{ mt: 4 }}>
                <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" fontWeight={600} gutterBottom>
                      {parsed.summary.etablissement}
                    </Typography>
                    <Typography variant="body1">
                      <b>Niveau:</b> {parsed.summary.niveau} <br />
                      <b>Classe:</b> {parsed.summary.classe} <br />
                      <b>Nombre élèves:</b> {parsed.summary.nbEleves}
                    </Typography>
                  </CardContent>
                </Card>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box>
                    <Typography variant="h6" color="secondary" fontWeight={600} gutterBottom>
                      Notes Controls Continues
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Matière</TableCell>
                            <TableCell>Contrôle 1</TableCell>
                            <TableCell>Contrôle 2</TableCell>
                            <TableCell>Contrôle 3</TableCell>
                            <TableCell>Contrôle 4</TableCell>
                            <TableCell>Activités intégrées</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {parsed.ccRows.map((row: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{row.matiere}</TableCell>
                              {row.notes.map((note: string, j: number) => (
                                <TableCell key={j}>{note}</TableCell>
                              ))}
                              {Array.from({ length: 5 - row.notes.length }).map((_, k) => (
                                <TableCell key={k + row.notes.length}></TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="secondary" fontWeight={600} gutterBottom>
                      Notes Examens
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Matière</TableCell>
                            <TableCell>Notes CC</TableCell>
                            <TableCell>Coefficient</TableCell>
                            <TableCell>Note Max</TableCell>
                            <TableCell>Note Moyenne Classe</TableCell>
                            <TableCell>Note Min</TableCell>
                            <TableCell>Note Examen</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {parsed.examRows.map((row: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{row.matiere}</TableCell>
                              <TableCell>{row.noteCC}</TableCell>
                              <TableCell>{row.coefficient}</TableCell>
                              <TableCell>{row.noteMax}</TableCell>
                              <TableCell>{row.noteMoyClasse}</TableCell>
                              <TableCell>{row.noteMin}</TableCell>
                              <TableCell>{row.noteExam}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  {parsed.moyenneSession && (
                    <Typography variant="body1" color="primary">
                      <b>Moyenne session:</b> {parsed.moyenneSession}
                    </Typography>
                  )}
                  {parsed.noteExamen && (
                    <Typography variant="body1" color="primary">
                      <b>Note examen:</b> {parsed.noteExamen}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default FetchGrades;
