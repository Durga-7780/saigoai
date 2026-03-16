import { Box, Divider, Paper, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';

const PayslipTemplate = ({ payslip, company }) => {
  if (!payslip) return null;

  const Row = ({ label, value, isBold = false }) => (
      <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
              {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: isBold ? 700 : 600 }}>
              {value || 'N/A'}
          </Typography>
      </Box>
  );

  return (
    <Paper 
        elevation={0}
        sx={{ 
            p: 4, 
            bgcolor: 'white', 
            color: 'black',
            width: '100%',
            maxWidth: '210mm',
            minHeight: '297mm', 
            mx: 'auto',
            boxSizing: 'border-box',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
        }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, letterSpacing: 1 }}>
                PAYSLIP <span style={{ fontWeight: 400 }}>{payslip.month?.toUpperCase()} {payslip.year}</span>
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{company?.name || 'MY COMPANY'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, fontSize: '0.8rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {company?.address || 'Company Address, City, State, Zip'}
                {company?.phone && <><br />Phone: {company.phone}</>}
                {company?.email && <><br />Email: {company.email}</>}
            </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
            {company?.logo_url ? (
                <Box 
                    component="img"
                    src={company.logo_url} 
                    alt="Company Logo" 
                    sx={{ 
                        maxHeight: '100px', 
                        maxWidth: '250px', 
                        objectFit: 'contain',
                        mb: 1
                    }} 
                />
            ) : (
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 900, opacity: 0.8 }}>
                    {company?.name?.substring(0, 4)?.toUpperCase() || 'LOGO'}
                </Typography>
            )}
            {company?.website && (
                 <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                     {company.website}
                 </Typography>
            )}
        </Box>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
        {payslip.employee_name}
      </Typography>

      {/* Employee Details - 4 Column Layout using Flex */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 3 }}>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="Employee ID" value={payslip.employee_id} /></Box>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="Joining Date" value={new Date(payslip.joining_date).toLocaleDateString()} /></Box>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="Department" value={payslip.department} /></Box>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="Location" value="Hyderabad" /></Box>

        <Box sx={{ width: '25%', pr: 2 }}><Row label="Designation" value={payslip.designation} /></Box>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="Payment Mode" value={payslip.bank_details?.payment_mode} /></Box>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="Bank Name" value={payslip.bank_details?.bank_name} /></Box>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="IFSC Code" value={payslip.bank_details?.ifsc_code} /></Box>

        <Box sx={{ width: '25%', pr: 2 }}><Row label="Account Number" value={payslip.bank_details?.account_number} /></Box>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="UAN" value={payslip.bank_details?.uan_number} /></Box>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="PF Number" value={payslip.bank_details?.pf_number} /></Box>
        <Box sx={{ width: '25%', pr: 2 }}><Row label="PAN" value={payslip.bank_details?.pan_number} /></Box>
      </Box>

      {/* Attendance Summary */}
      <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 2, mb: 4, display: 'flex', justifyContent: 'space-between', border: '1px solid #eee' }}>
        <Box>
            <Typography variant="caption" color="text.secondary">Total Days</Typography>
            <Typography variant="h6" fontWeight={700}>{payslip.attendance?.total_days}</Typography>
        </Box>
        <Box>
            <Typography variant="caption" color="text.secondary">Working Days</Typography>
            <Typography variant="h6" fontWeight={700}>{payslip.attendance?.working_days}</Typography>
        </Box>
        <Box>
            <Typography variant="caption" color="text.secondary">LOP Days</Typography>
            <Typography variant="h6" fontWeight={700}>{payslip.attendance?.loss_of_pay_days}</Typography>
        </Box>
         <Box>
            <Typography variant="caption" color="text.secondary">Payable Days</Typography>
            <Typography variant="h6" fontWeight={700}>{payslip.attendance?.payable_days}</Typography>
        </Box>
      </Box>

      {/* Salary Details - 2 Column Layout */}
      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Earnings Column */}
        <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, color: 'success.main', textTransform: 'uppercase' }}>Earnings</Typography>
            <Table size="small">
                <TableBody>
                    {[
                        ['Basic Salary', payslip.earnings.basic],
                        ['HRA', payslip.earnings.hra],
                        ['Conveyance', payslip.earnings.conveyance],
                        ['Special Allowance', payslip.earnings.special_allowance],
                        ['Professional Allow.', payslip.earnings.professional_allowance],
                        ['Uniform Allowance', payslip.earnings.uniform_allowance],
                        ['Shift Allowance', payslip.earnings.shift_allowance],
                        ['Medical Allowance', payslip.earnings.medical_allowance],
                    ].map(([label, value]) => value > 0 && (
                        <TableRow key={label}>
                            <TableCell sx={{ borderBottom: '1px solid #f0f0f0', pl: 0, py: 1, color: 'text.primary' }}>{label}</TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid #f0f0f0', pr: 0, py: 1, fontWeight: 500 }}>{value.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell sx={{ borderTop: '2px solid #000', pl: 0, py: 1.5, fontWeight: 700 }}>Total Earnings (A)</TableCell>
                        <TableCell align="right" sx={{ borderTop: '2px solid #000', pr: 0, py: 1.5, fontWeight: 700 }}>{payslip.earnings.total_earnings.toFixed(2)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Box>

        {/* Deductions Column */}
        <Box sx={{ flex: 1, borderLeft: '1px dashed #e0e0e0', pl: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, color: 'error.main', textTransform: 'uppercase' }}>Deductions</Typography>
            <Table size="small">
                <TableBody>
                    {[
                        ['PF (Employee)', payslip.deductions.pf_employee],
                        ['Professional Tax', payslip.deductions.professional_tax],
                        ['Income Tax', payslip.deductions.income_tax],
                        ['Loss of Pay', payslip.deductions.loss_of_pay],
                    ].map(([label, value]) => (
                        <TableRow key={label}>
                            <TableCell sx={{ borderBottom: '1px solid #f0f0f0', pl: 0, py: 1, color: 'text.primary' }}>{label}</TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid #f0f0f0', pr: 0, py: 1, fontWeight: 500 }}>{value.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                    {/* Padding rows to align totals if needed */}
                    <TableRow>
                        <TableCell sx={{ borderTop: '2px solid #000', pl: 0, py: 1.5, fontWeight: 700 }}>Total Deductions (B)</TableCell>
                        <TableCell align="right" sx={{ borderTop: '2px solid #000', pr: 0, py: 1.5, fontWeight: 700 }}>{payslip.deductions.total_deductions.toFixed(2)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            
            <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, color: 'info.main', textTransform: 'uppercase' }}>Employer Contribution</Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ borderBottom: '1px solid #f0f0f0', pl: 0, py: 1 }}>PF (Employer)</TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid #f0f0f0', pr: 0, py: 1 }}>{payslip.deductions.pf_employer.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Box>
        </Box>
      </Box>

      {/* Net Pay Section */}
      <Box sx={{ mt: 5, bgcolor: '#000', color: 'white', p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>Net Salary Payable</Typography>
              <Typography variant="h4" fontWeight={700}>₹ {payslip.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          </Box>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 1 }} />
          <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
               {payslip.net_salary_words}
          </Typography>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 'auto', pt: 8 }}>
          <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              * This is a computer generated document and does not require a physical signature.
          </Typography>
          <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              * Generated on {new Date().toLocaleDateString()}
          </Typography>
      </Box>

    </Paper>
  );
};

export default PayslipTemplate;
