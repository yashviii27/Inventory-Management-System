import React, { useState, useEffect, useCallback } from "react";
import { invoiceService } from "../../services/invoiceService";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./InvoiceView.css";

// ✅ Move helper functions outside the component to make them stable
const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }
  return defaultValue;
};

const safeDate = (value, defaultValue = new Date()) => {
  if (value === null || value === undefined) return defaultValue;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? defaultValue : date;
  }
  return defaultValue;
};

const safeString = (value, defaultValue = "") => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return defaultValue;
};

// ✅ Recursive function to flatten objects and remove any nested objects
const flattenObject = (obj, prefix = "") => {
  const result = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        // Recursively flatten nested objects
        Object.assign(result, flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        // Handle arrays - convert to simple array of primitives or flattened objects
        result[newKey] = value.map((item) => {
          if (item && typeof item === "object" && !(item instanceof Date)) {
            return flattenObject(item);
          }
          return item;
        });
      } else {
        // Primitive values
        result[newKey] = value;
      }
    }
  }

  return result;
};

// ✅ Enhanced data validation function
const validateAndCleanData = (data) => {
  const cleaned = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];

      // Skip functions and complex objects
      if (typeof value === "function") continue;

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        console.warn(`⚠️ Object detected in ${key}:`, value);
        // Recursively clean nested objects
        cleaned[key] = validateAndCleanData(value);
      } else if (Array.isArray(value)) {
        // Clean array items
        cleaned[key] = value.map((item) => {
          if (
            item &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            !(item instanceof Date)
          ) {
            return validateAndCleanData(item);
          }
          return item;
        });
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned;
};

// ✅ Helper for payment status badges
const getPaymentStatusBadge = (status) => {
  const statusLower = (status || "pending").toLowerCase();
  switch (statusLower) {
    case "paid":
      return "bg-success";
    case "pending":
      return "bg-warning text-dark";
    case "partial":
      return "bg-info text-dark";
    case "cancelled":
      return "bg-danger";
    default:
      return "bg-secondary";
  }
};

const InvoiceView = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // ✅ Fetch invoice from backend with retry mechanism - UPDATED WITH ENHANCED ID VALIDATION
  const fetchInvoice = useCallback(
    async (isRetry = false) => {
      // ✅ Enhanced ID validation - handle both string and object cases
      if (!invoiceId) {
        setError("No invoice ID provided");
        setLoading(false);
        return;
      }

      // ✅ Handle case where invoiceId might be an object
      let invoiceIdString = invoiceId;
      if (typeof invoiceId === "object") {
        console.warn(
          "⚠️ invoiceId is an object, converting to string:",
          invoiceId
        );
        invoiceIdString = invoiceId._id || invoiceId.id || String(invoiceId);
      }

      // ✅ Enhanced validation for MongoDB ObjectId
      const isValidId =
        typeof invoiceIdString === "string" &&
        invoiceIdString.length === 24 &&
        /^[0-9a-fA-F]+$/.test(invoiceIdString);

      if (!isValidId) {
        console.error("❌ Invalid invoice ID format:", invoiceIdString);
        setError("Invalid invoice ID format");
        setLoading(false);
        return;
      }

      if (!isRetry) {
        setLoading(true);
      }

      setError(null);

      try {
        console.log("🔍 Fetching invoice with ID:", invoiceIdString);
        const res = await invoiceService.getInvoice(invoiceIdString);
        console.log("📦 API Response:", res.data);

        if (res.data?.success && res.data.invoice) {
          const { invoice: invoiceData, sale, details } = res.data;

          // ✅ Validate we have required data
          if (!invoiceData) {
            throw new Error("Invoice data is missing from response");
          }

          console.log("🔍 Raw data structures:", {
            invoiceData: invoiceData,
            sale: sale,
            details: details,
          });

          // ✅ First, flatten all objects to remove nested structures
          const flatInvoiceData = flattenObject(invoiceData);
          const flatSale = sale ? flattenObject(sale) : {};
          const flatDetails = Array.isArray(details)
            ? details.map((detail) => flattenObject(detail))
            : [];

          console.log("🔍 Flattened data:", {
            flatInvoiceData,
            flatSale,
            flatDetails,
          });

          // ✅ Transform response into displayable format with explicit type conversion
          const formattedInvoice = {
            // Basic info - explicitly convert to strings
            billNo: safeString(
              flatSale.bill_no || flatInvoiceData.bill_no || ""
            ),

            _id: safeString(flatInvoiceData._id),
            invoiceNumber: safeString(
              flatInvoiceData.invoiceNumber ||
                `INV-${flatInvoiceData._id?.slice(-6).toUpperCase()}`
            ),
            invoiceDate: safeDate(flatInvoiceData.date || flatSale.date),
            dueDate: safeDate(
              flatInvoiceData.dueDate || flatInvoiceData.date || flatSale.date
            ),

            // Customer info - explicitly convert to strings
            customerName: safeString(
              flatSale.client_name || flatInvoiceData.client_name || "N/A"
            ),
            customerEmail: safeString(
              flatSale.client_email || flatInvoiceData.customerEmail || ""
            ),
            customerPhone: safeString(
              flatSale.client_phone || flatInvoiceData.customerPhone || ""
            ),
            customerAddress: safeString(
              flatSale.client_address || flatInvoiceData.customerAddress || ""
            ),

            // Payment info - explicitly convert to strings
            paymentMethod: safeString(
              flatInvoiceData.paymentMethod || flatSale.paymentMethod || "cash"
            ),
            paymentStatus: safeString(
              flatInvoiceData.paymentStatus ||
                flatInvoiceData.status?.toLowerCase() ||
                "pending"
            ),

            // Items - ensure all values are safe and flattened
            items: Array.isArray(flatDetails)
              ? flatDetails.map((d, index) => {
                  // Extract product name from flattened structure
                  let productName = "Unnamed Product";
                  if (d.product_name) {
                    productName = safeString(d.product_name);
                  } else if (d.product && typeof d.product === "object") {
                    productName = safeString(
                      d.product.name || d.product.productName
                    );
                  } else if (d.productName) {
                    productName = safeString(d.productName);
                  }

                  return {
                    srNo: Number(index + 1),
                    productName: productName,
                    quantity: safeNumber(d.quantity),
                    unitPrice: safeNumber(d.rate || d.unitPrice),
                    total: safeNumber(
                      d.amount ||
                        d.total ||
                        d.quantity * (d.rate || d.unitPrice)
                    ),
                  };
                })
              : [],

            // Financials - explicitly convert to numbers
            subtotal: safeNumber(flatInvoiceData.subtotal || flatSale.amount),
            gstRate: safeNumber(flatInvoiceData.gstRate || 18),
            gstAmount: safeNumber(flatInvoiceData.gstAmount),
            discount: safeNumber(flatInvoiceData.discount),
            totalAmount: safeNumber(
              flatInvoiceData.total_amount || flatSale.amount
            ),

            // Additional fields - explicitly convert to strings
            notes: safeString(flatInvoiceData.notes),
            terms: safeString(
              flatInvoiceData.terms || "Payment due within 30 days"
            ),
          };

          // ✅ Final validation - ensure no objects remain
          console.log("🔍 Final validation of formatted invoice:");
          const finalCleanedInvoice = validateAndCleanData(formattedInvoice);

          let hasObjects = false;
          Object.keys(finalCleanedInvoice).forEach((key) => {
            const value = finalCleanedInvoice[key];
            if (
              value &&
              typeof value === "object" &&
              !Array.isArray(value) &&
              !(value instanceof Date)
            ) {
              console.error(`❌ OBJECT STILL FOUND: ${key}`, value);
              hasObjects = true;
            }
          });

          if (hasObjects) {
            // Last resort: convert any remaining objects to strings
            const stringifiedInvoice = {};
            Object.keys(finalCleanedInvoice).forEach((key) => {
              const value = finalCleanedInvoice[key];
              if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                !(value instanceof Date)
              ) {
                stringifiedInvoice[key] = JSON.stringify(value);
              } else {
                stringifiedInvoice[key] = value;
              }
            });
            setInvoice(stringifiedInvoice);
          } else {
            console.log(
              "✅ Formatted Invoice (no objects):",
              finalCleanedInvoice
            );
            setInvoice(finalCleanedInvoice);
          }

          setRetryCount(0); // Reset retry count on success
        } else {
          const errorMsg = res.data?.message || "Invoice data not found!";
          console.error("❌ Invalid response structure:", res.data);
          setError(errorMsg);
        }
      } catch (err) {
        console.error("❌ Error fetching invoice:", err);

        // Enhanced error handling
        if (err.response?.status === 404) {
          setError("Invoice not found. It may have been deleted.");
        } else if (err.response?.status === 400) {
          setError("Invalid invoice ID format");
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load invoice!"
          );
        }

        // If it's a 404 and we haven't retried too many times, retry after delay
        if (err.response?.status === 404 && retryCount < 3) {
          console.log(`🔄 Retrying invoice fetch (${retryCount + 1}/3)...`);
          setRetryCount((prev) => prev + 1);
          setTimeout(() => fetchInvoice(true), 1000 * (retryCount + 1)); // 1s, 2s, 3s delays
          return;
        }
      } finally {
        setLoading(false);
      }
    },
    [invoiceId, retryCount]
  );

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    } else {
      setLoading(false);
    }
  }, [fetchInvoice, invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) {
      alert("Invoice content not found!");
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeightMm = (imgProps.height * pdfWidth) / imgProps.width;

      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeightMm);
      } else {
        let y = 0;
        const pageHeight = (canvas.width / pdfWidth) * pdfHeight;
        while (y < canvas.height) {
          const pageCanvas = document.createElement("canvas");
          const ctx = pageCanvas.getContext("2d");
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(canvas.height - y, pageHeight);
          ctx.drawImage(
            canvas,
            0,
            y,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          );
          const pageData = pageCanvas.toDataURL("image/png");
          if (y > 0) pdf.addPage();
          pdf.addImage(
            pageData,
            "PNG",
            0,
            0,
            pdfWidth,
            (pageCanvas.height * pdfWidth) / canvas.width
          );
          y += pageCanvas.height;
        }
      }

      const fileName = `invoice_${
        invoice?.invoiceNumber
      }_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      alert("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF!");
    }
  };

  // ✅ Safe rendering functions
  const renderDate = (date) => {
    try {
      return safeDate(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const renderCurrency = (amount) => {
    try {
      return `₹${safeNumber(amount).toFixed(2)}`;
    } catch (error) {
      return "₹0.00";
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchInvoice();
  };

  // ✅ Final safety check before rendering
  const renderValue = (value) => {
    if (value === null || value === undefined) return "";
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      console.error("❌ OBJECT DETECTED DURING RENDER:", value);
      return "[Object]";
    }
    return value;
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading invoice...</p>
        {retryCount > 0 && (
          <p className="text-info small">Retrying... ({retryCount}/3)</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-5">
        <div className="alert alert-danger">
          <h5>❌ Error Loading Invoice</h5>
          <p className="mb-3">{error}</p>
          <button onClick={handleRetry} className="btn btn-primary me-2">
            Try Again
          </button>
          {onClose && (
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center p-5">
        <div className="alert alert-warning">
          <h5>⚠️ Invoice not found</h5>
          <p>The requested invoice could not be loaded.</p>
          {onClose && (
            <button onClick={onClose} className="btn btn-secondary mt-2">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-container">
      {/* 🔹 Action Buttons */}
      <div className="invoice-actions mb-3 d-print-none">
        <button onClick={handlePrint} className="btn btn-primary me-2">
          <i className="bi bi-printer me-1"></i>
          Print Invoice
        </button>
        <button onClick={handleDownloadPDF} className="btn btn-secondary me-2">
          <i className="bi bi-download me-1"></i>
          Download PDF
        </button>
        {onClose && (
          <button onClick={onClose} className="btn btn-light">
            <i className="bi bi-x-circle me-1"></i>
            Close
          </button>
        )}
      </div>

      {/* 🔹 Invoice Content */}
      <div className="invoice card shadow" id="invoice-content">
        <div className="card-body p-4">
          {/* Header */}
          <div className="invoice-header row border-bottom pb-4 mb-4">
            <div className="col-md-6">
              <h2 className="text-primary fw-bold mb-3">StockSmart</h2>
              <p className="mb-1">
                <i className="bi bi-geo-alt-fill me-2"></i>
                StockSmart Distribution Center
              </p>
              <p className="mb-1">
                22, MG Road, Ahmedabad, Gujarat - 380009 India
              </p>
              <p className="mb-1">
                <i className="bi bi-telephone-fill me-2"></i>
                +91 9876543210
              </p>
              <p className="mb-1">
                <i className="bi bi-envelope-fill me-2"></i>
                info@stocksmart.in
              </p>
              <p className="mb-0">
                <strong>GSTIN:</strong> 07AABCU9603R1ZM
              </p>
            </div>
            <div className="col-md-6 text-end">
              <h1 className="text-success fw-bold mb-3">TAX INVOICE</h1>
              <div className="invoice-meta">
                <p className="mb-2">
                  <strong>Invoice #:</strong>{" "}
                  <span className="badge bg-primary fs-6">
                    {renderValue(invoice.invoiceNumber)}
                  </span>
                </p>
                <p>
                  <strong>Bill No:</strong> {renderValue(invoice.billNo)}
                </p>
                <p className="mb-2">
                  <strong>Invoice Date:</strong>{" "}
                  {renderDate(invoice.invoiceDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="customer-info row mb-4">
            <div className="col-md-6">
              <h5 className="text-primary mb-3">
                <i className="bi bi-person-fill me-2"></i>
                Bill To:
              </h5>
              <div className="customer-details">
                <p className="mb-2">
                  <strong className="fs-5">
                    {renderValue(invoice.customerName)}
                  </strong>
                </p>
                {invoice.customerEmail && (
                  <p className="mb-1">
                    <i className="bi bi-envelope me-2"></i>
                    {renderValue(invoice.customerEmail)}
                  </p>
                )}
                {invoice.customerPhone && (
                  <p className="mb-1">
                    <i className="bi bi-telephone me-2"></i>
                    {renderValue(invoice.customerPhone)}
                  </p>
                )}
                {invoice.customerAddress && (
                  <p className="mb-0">
                    <i className="bi bi-geo-alt me-2"></i>
                    {renderValue(invoice.customerAddress)}
                  </p>
                )}
              </div>
            </div>
            <div className="col-md-6 text-end">
              <h5 className="text-primary mb-3">Payment Status</h5>
              <div className="payment-info">
                <span
                  className={`badge fs-5 px-4 py-2 ${getPaymentStatusBadge(
                    invoice.paymentStatus
                  )}`}
                >
                  {renderValue(invoice.paymentStatus).toUpperCase()}
                </span>
                <p className="mt-3 mb-0">
                  <strong>Payment Method:</strong>{" "}
                  {renderValue(invoice.paymentMethod).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="table-responsive mb-4">
            <table className="table table-bordered invoice-items">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "50px" }}>#</th>
                  <th>Item Description</th>
                  <th style={{ width: "100px" }} className="text-center">
                    Quantity
                  </th>
                  <th style={{ width: "120px" }} className="text-end">
                    Unit Price
                  </th>
                  <th style={{ width: "140px" }} className="text-end">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, i) => (
                    <tr key={i}>
                      <td className="text-center">{renderValue(item.srNo)}</td>
                      <td>
                        <strong>{renderValue(item.productName)}</strong>
                      </td>
                      <td className="text-center">
                        {renderValue(item.quantity)}
                      </td>
                      <td className="text-end">
                        {renderCurrency(item.unitPrice)}
                      </td>
                      <td className="text-end">
                        <strong>{renderCurrency(item.total)}</strong>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-3">
                      No items in this invoice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="row justify-content-end">
            <div className="col-md-5">
              <div className="invoice-totals">
                <div className="d-flex justify-content-between border-bottom py-2">
                  <span>Subtotal:</span>
                  <span>{renderCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="d-flex justify-content-between border-bottom py-2 text-success">
                    <span>Discount:</span>
                    <span>-{renderCurrency(invoice.discount)}</span>
                  </div>
                )}
                {invoice.gstAmount > 0 && (
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <span>GST ({renderValue(invoice.gstRate)}%):</span>
                    <span>{renderCurrency(invoice.gstAmount)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between py-3 grand-total bg-light px-3 rounded mt-2">
                  <strong className="fs-5">Total Amount:</strong>
                  <strong className="fs-4 text-success">
                    {renderCurrency(invoice.totalAmount)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* GST Breakdown */}
          {invoice.gstAmount > 0 && (
            <div className="row mt-3">
              <div className="col-12">
                <div className="gst-breakdown p-3 bg-light rounded small">
                  <h6 className="text-primary mb-2">
                    <i className="bi bi-receipt me-2"></i>
                    GST Breakdown:
                  </h6>
                  <div className="row">
                    <div className="col-md-4">
                      <strong>CGST (9%):</strong>{" "}
                      {renderCurrency(invoice.gstAmount / 2)}
                    </div>
                    <div className="col-md-4">
                      <strong>SGST (9%):</strong>{" "}
                      {renderCurrency(invoice.gstAmount / 2)}
                    </div>
                    <div className="col-md-4">
                      <strong>Total GST (18%):</strong>{" "}
                      {renderCurrency(invoice.gstAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="invoice-notes mt-4 p-3 bg-light rounded">
              <h6 className="text-primary mb-2">
                <i className="bi bi-sticky me-2"></i>
                Notes:
              </h6>
              <p className="mb-0">{renderValue(invoice.notes)}</p>
            </div>
          )}

          {/* Footer */}
          <div className="invoice-footer mt-4 pt-4 border-top text-center">
            <p className="text-muted mb-2">
              <strong>Thank you for your business!</strong>
            </p>
            <p className="text-muted mb-1">
              <i className="bi bi-info-circle me-1"></i>
              {renderValue(invoice.terms)}
            </p>
            <p className="text-muted small mb-0">
              This is a computer-generated invoice and does not require a
              signature.
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .invoice-actions {
            display: none !important;
          }
          .invoice {
            box-shadow: none !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceView;
