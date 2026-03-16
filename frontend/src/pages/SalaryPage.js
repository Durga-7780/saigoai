import {
    Close,
    Description,
    Download,
    Visibility
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card, CardContent,
    Chip, Container,
    Dialog, DialogContent,
    Grid,
    IconButton,
    Typography
} from '@mui/material';
import html2pdf from 'html2pdf.js';
import { useEffect, useState } from 'react';
import PayslipTemplate from '../components/PayslipTemplate';
import { companyAPI, payrollAPI } from '../services/api'; // Ensure this path is correct

const SalaryPage = () => {
    const [payslips, setPayslips] = useState([]);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [company, setCompany] = useState(null);

    useEffect(() => {
        fetchPayslips();
        fetchCompanySettings();
    }, []);

    const fetchCompanySettings = async () => {
        try {
            const res = await companyAPI.getSettings();
            setCompany(res.data);
        } catch (error) {
            console.error("Failed to load company settings", error);
        }
    };

    const fetchPayslips = async () => {
        try {
            const response = await payrollAPI.getMyPayslips();
            setPayslips(response.data);
        } catch (error) {
            console.error('Failed to fetch payslips:', error);
        }
    };

    const handleView = (payslip) => {
        setSelectedPayslip(payslip);
        setOpenDialog(true);
    };

    const handleDownload = () => {
        const element = document.getElementById('payslip-print-area');
        const opt = {
            margin:       5,
            filename:     `Payslip_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Temporarily adjust style for PDF generation
        const originalStyle = element.style.cssText;
        element.style.width = '180mm'; // Reduced width to ensure valid margins
        element.style.maxWidth = '100%';
        element.style.height = 'auto';
        element.style.backgroundColor = 'white';
        
        html2pdf().from(element).set(opt).save().then(() => {
            element.style.cssText = originalStyle;
        });
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
                My Salary & Payslips
            </Typography>

            <Grid container spacing={3}>
                {(Array.isArray(payslips) ? payslips : []).map((payslip) => (
                    <Grid item xs={12} md={4} key={payslip.id}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            transition: 'all 0.3s',
                            '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Chip 
                                        label={`${payslip.month} ${payslip.year}`} 
                                        color="primary" 
                                        variant="outlined" 
                                        sx={{ fontWeight: 600 }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="h6" fontWeight={700}>
                                            ₹{payslip.net_salary.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Earnings</Typography>
                                        <Typography variant="body2" color="success.main">
                                            +₹{payslip.earnings.total_earnings.toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Deductions</Typography>
                                        <Typography variant="body2" color="error.main">
                                            -₹{payslip.deductions.total_deductions.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Button 
                                    variant="contained" 
                                    fullWidth 
                                    startIcon={<Visibility />}
                                    onClick={() => handleView(payslip)}
                                >
                                    View Slip
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {payslips.length === 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 4 }}>
                            <Description sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                No payslips available yet
                            </Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* Payslip View Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
                scroll="body"
            >
                <Box sx={{ 
                    position: 'sticky', 
                    top: 0, 
                    right: 0, 
                    p: 2, 
                    bgcolor: 'white', 
                    zIndex: 1, 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1
                }}>
                    <Button 
                        startIcon={<Download />} 
                        variant="contained"
                        onClick={handleDownload}
                    >
                        Download PDF
                    </Button>
                    <IconButton onClick={() => setOpenDialog(false)}>
                        <Close />
                    </IconButton>
                </Box>
                <DialogContent sx={{ p: 0, bgcolor: '#f5f5f5' }}>
                    <div id="payslip-print-area">
                        <PayslipTemplate payslip={selectedPayslip} company={company} />
                    </div>
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default SalaryPage;
