# Extract EditPaymentDialog from PaymentsPage.jsx
$lines = Get-Content "src/pages/PaymentsPage.jsx"

$header = @'
import React, { useState, useEffect } from 'react';
import { fCurrency } from '../../utils/formatNumber';
import { calculateMonthlyAccountBalance } from '../../utils/monthlyBalanceUtils';
import {
  createLocalDate,
  formatPaymentDate,
  formatDateForInput,
  getStatusColor,
  getStatusText,
  formatCurrency,
  cleanCurrency,
  isColjuegosCommitment,
  imageToPdf,
  combineFilesToPdf
} from './paymentsHelpers';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  TextField,
  alpha,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Business as CompanyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { doc, updateDoc, getDoc, deleteDoc, collection, query, orderBy, getDocs, addDoc, where, deleteField } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';

/**
 * EditPaymentDialog - Extracted from PaymentsPage.jsx
 * Handles editing, file upload, and deletion of payments.
 */
const EditPaymentDialog = ({
  open,
  payment,
  onClose,
  companies,
  personalAccounts,
  incomes,
  payments,
  showNotification,
  currentUser,
  userProfile,
  isAdmin,
  logActivity,
}) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  // Edit form state
  const [editingPayment, setEditingPayment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    concept: '',
    amount: '',
    method: '',
    notes: '',
    reference: '',
    date: '',
    companyName: '',
    provider: '',
    interests: '',
    interesesDerechosExplotacion: '',
    interesesGastosAdministracion: '',
    derechosExplotacion: '',
    gastosAdministracion: '',
    originalAmount: '',
    sourceAccount: '',
    sourceBank: '',
    tax4x1000: 0
  });

  // Commitment data
  const [loadingCommitment, setLoadingCommitment] = useState(false);
  const [commitmentData, setCommitmentData] = useState(null);

  // Delete confirmation
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // File upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

'@

# --- EXTRACT HANDLER FUNCTIONS (lines 242-263 loadCommitmentData, then 1212-2175 handlers) ---
# loadCommitmentData: lines 242-263 (0-indexed: 241-262)
$loadCommitmentData = $lines[241..262] -join "`n"

# handleEditPayment + all handlers: lines 1212-2175 (0-indexed: 1211-2174)
$handlers = $lines[1211..2174] -join "`n"

# --- INITIALIZATION useEffect ---
$initEffect = @'

  // Initialize form when payment prop changes
  useEffect(() => {
    if (open && payment) {
      handleEditPayment(payment);
    }
    if (!open) {
      // Reset state when dialog closes
      setEditingPayment(null);
      setCommitmentData(null);
      setSelectedFiles([]);
      setDragActive(false);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [open, payment]);

'@

# --- OVERRIDE handleCloseEditPayment to call onClose ---
$closeOverride = @'

  // Override close to notify parent
  const handleCloseDialog = () => {
    handleCloseEditPayment();
    onClose();
  };

'@

# --- EXTRACT DIALOG JSX (lines 3021-4484) ---
# Edit Dialog: 3021-4391 (0-indexed: 3020-4390)
# Delete Dialog: 4393-4484 (0-indexed: 4392-4483)
$editDialogJsx = $lines[3020..4390] -join "`n"
$deleteDialogJsx = $lines[4392..4483] -join "`n"

# --- BUILD THE RETURN STATEMENT ---
$returnBlock = @"

  return (
    <>
$editDialogJsx

$deleteDialogJsx
    </>
  );
};

export default EditPaymentDialog;
"@

# --- COMPOSE FULL FILE ---
$fullContent = $header + "`n`n" + $loadCommitmentData + "`n`n" + $initEffect + "`n" + $handlers + "`n" + $closeOverride + "`n" + $returnBlock

# Write to file
$fullContent | Out-File -FilePath "src/pages/payments/EditPaymentDialog.jsx" -Encoding UTF8

$lineCount = ($fullContent -split "`n").Count
Write-Host "EditPaymentDialog.jsx created with $lineCount lines"
