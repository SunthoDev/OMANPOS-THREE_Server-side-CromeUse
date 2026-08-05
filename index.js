require("dotenv").config();
const { ObjectId } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const port = process.env.PORT || 4000;
const multer = require("multer");

// --- Libraries for the new Puppeteer PDF route ---
const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs/promises");
const puppeteer = require("puppeteer");
const QRCode = require("qrcode");
const fsClassic = require("fs");


// ============================================
// Middleware
// ============================================
const corsOptions = {
  origin: ["http://localhost:2000", "http://127.0.0.1:2000", "https://omanpost.docswallat.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// ============================================================
// ==== Static file serve + CORS for PDF viewer====
// ============================================================
app.use(
  "/files",
  cors(corsOptions),
  express.static(path.join(__dirname, "files"))
);



// ===============================================================
// Database Connection
// ===============================================================

const { MongoClient, ServerApiVersion } = require("mongodb");
// Database Uri Of mongodb
// ===============================
const uri = `mongodb+srv://${process.env.ENV_NAME}:${process.env.ENV_PASSWORD}@cluster0.msfjk2l.mongodb.net/?appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // ==================================================================
    // All Database Code Start
    // ==================================================================

    const userCollection = client.db("OmanPostWebsiteThree").collection("User");
    const InformationOfUserCollection = client.db("OmanPostWebsiteThree").collection("UserInformation");
    const WebsiteInformationCollection = client.db("OmanPostWebsiteThree").collection("WebsiteInformation");

    // ==================================================
    // Admin Panel Work  Start
    // ==================================================

    // get all user Admin Dashboard _________________
    app.get("/users", async (req, res) => {
      let result = await userCollection.find().toArray();
      res.send(result);
    });

    // SingUp user data saved Database ____________________
    app.post("/users", async (req, res) => {
      let user = req.body;
      let query = { email: user.email };
      let existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "Already existing user" });
      }
      let result = await userCollection.insertOne(user);
      res.send(result);
    });

    // check user role show Dashboard _________________________________
    app.get("/userRoleCheck/:email", async (req, res) => {
      let email = req.params.email;
      let query = { email: email };
      let result = await userCollection.findOne(query);
      res.send(result);
    });
    // Admin Update User Role Admin __________________________
    app.patch("/AdminUpdateRoleAdmin/:id", async (req, res) => {
      let upId = req.params.id;
      let filter = { _id: new ObjectId(upId) };
      let updateAdmin = {
        $set: {
          role: "admin",
        },
      };
      let result = await userCollection.updateOne(filter, updateAdmin);
      res.send(result);
    });
    // Admin Update User Role User __________________________
    app.patch("/AdminUpdateRoleUser/:id", async (req, res) => {
      let upId = req.params.id;
      let filter = { _id: new ObjectId(upId) };
      let updateAdmin = {
        $set: {
          role: "user",
        },
      };
      let result = await userCollection.updateOne(filter, updateAdmin);
      res.send(result);
    });

    // Admin Delete User __________________________
    app.delete("/AdminDeleteUsers/:id", async (req, res) => {
      let upId = req.params.id;
      let query = { _id: new ObjectId(upId) };
      let result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // ================================================================================

    // get all OPL User Information _________________
    app.get("/UserInfo", async (req, res) => {
      let result = await InformationOfUserCollection.find().toArray();
      res.send(result);
    });
    // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // use pagination for (USER) Start
    // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    // Total item number get use pagination
    app.get("/totalUserCount", async (req, res) => {
      const result = await InformationOfUserCollection.estimatedDocumentCount();
      res.send({ totalUsers: result });
    });
    app.get("/UserAllDataPagination", async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 10;
      const skip = page * limit;
      let result = await InformationOfUserCollection.find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send(result);
    });

    // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // use pagination for (USER) End
    // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    // Post OPAL User Information ____________________
    app.post("/InsertUserInfo", async (req, res) => {
      let user = req.body;
      let result = await InformationOfUserCollection.insertOne(user);
      res.send(result);
    });
    // Find OPAL User Unique Information by _id_________________________________
    app.get("/UserMAINInfo/:id", async (req, res) => {
      let id = req.params.id;
      let finalId = id;
      if (finalId.endsWith("==")) {
        finalId = finalId.slice(0, -2) + "%3D%3D";
      } else if (!finalId.endsWith("%3D%3D")) {
        finalId += "%3D%3D";
      }
      // console.log(finalId);
      let query = { VerificationNo: finalId };
      let result = await InformationOfUserCollection.findOne(query);
      res.send(result);
    });

    // Find OPAL User Unique Information by verifaction number _________________________________
    app.get("/UpdateUserDataGet/:id", async (req, res) => {
      let id = req.params.id;
      let query = { _id: new ObjectId(id) };
      let result = await InformationOfUserCollection.findOne(query);
      res.send(result);
    });

    // Admin Delete User __________________________
    app.delete("/DeleteUserInformation/:id", async (req, res) => {
      let upId = req.params.id;
      let query = { _id: new ObjectId(upId) };
      let result = await InformationOfUserCollection.deleteOne(query);
      res.send(result);
    });
    // Admin Update all user data Database __________________________
    app.patch("/AdminUpdateUserInformation/:id", async (req, res) => {
      let upId = req.params.id;
      let upData = req.body;
      let filter = { _id: new ObjectId(upId) };
      let updateAdmin = {
        $set: {
          TransactionNumber: upData.TransactionNumberUP,
          PaymentID: upData.PaymentIDUP,
          TotalPayment: upData.TotalPaymentUP,
          TransactionDate: upData.TransactionDateUP,

          DocumentType: upData.DocumentTypeUP,
          ApplicantName: upData.ApplicantNameUP,
          ApplicantPDFName: upData.ApplicantPDFNameUP,
          EmailId: upData.EmailIdUP,
          PhoneNumber: upData.PhoneNumberUP,

          VerifierName: upData.VerifierNameUP,
          VerificationStatus: upData.VerificationStatusUP,
          VerificationDateTime: upData.VerificationDateTimeUP,

          VerifyBy: upData.VerifyByUP,
          VerifyAt: upData.VerifyAtUP,
          ApproverName: upData.ApproverNameUP,
        },
      };
      let result = await InformationOfUserCollection.updateOne(
        filter,
        updateAdmin
      );
      res.send(result);
    });

    // =====================================================

    // ইউজার আইডি দিয়ে ডেটা খুঁজে পাওয়ার API
    // ===============================================
    app.get("/getWebsiteInfo", async (req, res) => {
    // আমরা যে কাস্টম নাম দিয়ে সেভ করেছি তা দিয়ে খুঁজব
    const result = await WebsiteInformationCollection.findOne({ identifier: "website-global-info" });
    res.send(result || {}); // ডাটা না থাকলে এরর দিবে না, খালি অবজেক্ট দিবে
    });
    
    // ডেটা অ্যাড বা আপডেট করার API
    // ===============================================
    app.put("/AdminUpdateWebsiteInfo", async (req, res) => {
      const { name, email } = req.body;
      try {
        // আমরা আইডি হিসেবে একটি ফিক্সড নাম ব্যবহার করছি যাতে সবসময় একটি ডকুমেন্টেই কাজ হয়
        const filter = { identifier: "website-global-info" }; 
        const options = { upsert: true }; // ডাটা না থাকলে তৈরি হবে, থাকলে আপডেট হবে

        const updateDoc = {
          $set: {
            identifier: "website-global-info", 
            name: name,
            email: email,
          },
        };
        const result = await WebsiteInformationCollection.updateOne(filter, updateDoc, options);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "সার্ভার এরর", error: error.message });
      }
    });     

    // ===========================================================================================================

    // =============================================
    // Multer Storage Create For keep a PDF Start
    // =============================================
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./files");
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname);
      },
    });
    const upload = multer({ storage: storage });
    // =========================================
    // Multer Storage Create For keep a PDF End
    // =========================================

    // ===================================================================================================
    // User Original PDF Upload Start
    // ===================================================================================================
    app.put(
      "/Original-upload-files/:id",
      upload.single("file"),
      async (req, res) => {
        let upId = req.params.id;
        let fileName = req.file.filename;
        // console.log(upId)
        // console.log(req.file)
        // console.log(fileName)
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }
        let filter = { _id: new ObjectId(upId) };
        let options = { upsert: true };
        let updatePDF = {
          $set: {
            originalPDF: fileName,
          },
        };
        let result = await InformationOfUserCollection.updateOne(
          filter,
          updatePDF,
          options
        );
        res.send(result);
      }
    );

    // ===================================================================================================
    // User Attested PDF Upload Start
    // ===================================================================================================
    app.put(
      "/Attested-upload-files/:id",
      upload.single("file"),
      async (req, res) => {
        let upId = req.params.id;
        let fileName = req.file.filename;
        // console.log(upId)
        // console.log(req.file)
        // console.log(fileName)
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }
        let filter = { _id: new ObjectId(upId) };
        let options = { upsert: true };
        let updatePDF = {
          $set: {
            attestedPDF: fileName,
          },
        };
        let result = await InformationOfUserCollection.updateOne(
          filter,
          updatePDF,
          options
        );
        res.send(result);
      }
    );

    // ===================================================================================================
    // When Admin Delete User Information in that time if have user PDF,
    // All PDF will be Delete with his info from server files folder.
    // ===================================================================================================
    app.delete("/delete-user-pdfs/:userId", async (req, res) => {
      try {
        const userId = req.params.userId;

        // 1) Find user document
        const user = await InformationOfUserCollection.findOne({
          _id: new ObjectId(userId),
        });
        // console.log(user)

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // 2) Extract PDFs
        const originalPDF = user.originalPDF || "";
        const attestedPDF = user.attestedPDF || "";

        const filesFolder = path.join(__dirname, "files");

        let deletedFiles = [];
        let failedFiles = [];

        // Helper: async delete file
        const deleteFile = async (fileName) => {
          if (!fileName) return;
          const filePath = path.join(filesFolder, fileName);
          try {
            await fs.access(filePath); // check if file exists
            await fs.unlink(filePath);  // delete file
            deletedFiles.push(fileName);
          } catch (err) {
            failedFiles.push(fileName);
            console.error("File delete error:", fileName, err.message);
          }
        };

        // 3) Delete based on availability
        if (originalPDF && attestedPDF) {
          await deleteFile(originalPDF);
          await deleteFile(attestedPDF);
        } else if (originalPDF && !attestedPDF) {
          await deleteFile(originalPDF);
        } else if (!originalPDF && attestedPDF) {
          await deleteFile(attestedPDF);
        }

        // 4) Update DB
        await InformationOfUserCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { originalPDF: "", attestedPDF: "" } }
        );

        res.send({
          success: true,
          deletedFiles,
          failedFiles,
          message: "PDF deletion completed successfully",
        });

      } catch (error) {
        console.error("Delete error:", error);
        return res.status(500).json({ message: "Server error while deleting PDFs" });
      }
    });


    // ===================================================================================================
    // Add these require statements at the top of your server.js
    // ===================================================================================================

    // I change some thing and add image arb !!
    app.get("/download/attested-hq/:id", async (req, res) => {
      let browser = null;
      try {
        const { id } = req.params;
        const documentData = await InformationOfUserCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!documentData || !documentData.attestedPDF) {
          return res
            .status(404)
            .send("Document not found or attested PDF is missing.");
        }

        // 1. Load Assets
        const ARabLogoBase64 = await fs.readFile(
          path.join(__dirname, "assets", "ARABIC.png"),
          "base64"
        );
        const leftLogoBase64 = await fs.readFile(
          path.join(__dirname, "assets", "EWWE.jpg"),
          "base64"
        );
        const headingBase64 = await fs.readFile(
          path.join(__dirname, "assets", "Heading.png"),
          "base64"
        );
        const verifiedBase64 = await fs.readFile(
          path.join(__dirname, "assets", "Verified.png"),
          "base64"
        );
        const arialFontBase64 = await fs.readFile(
          path.join(__dirname, "assets", "ARIAL.TTF"),
          "base64"
        );
        const timesFontBase64 = await fs.readFile(
          path.join(__dirname, "assets", "times.ttf"),
          "base64"
        );

        // ================= New Import =================
        const RobotoCondensedMediumFontBase64 = await fs.readFile(
          path.join(__dirname, "assets", "RobotoCondensed-Medium.ttf"),
          "base64"
        );
        const RobotoRegularFontBase64 = await fs.readFile(
          path.join(__dirname, "assets", "RobotoCondensed-Regular.ttf"),
          "base64"
        );
        const RobotoSemiBoldFontBase64 = await fs.readFile(
          path.join(__dirname, "assets", "RobotoCondensed-SemiBold.ttf"),
          "base64"
        );
        const CalibriboldFontBase64 = await fs.readFile(
          path.join(__dirname, "assets", "Calibribold.woff"),
          "base64"
        );
        const TimesNewRomanBolds = await fs.readFile(
          path.join(__dirname, "assets", "TimesNewRomanBold.woff"),
          "base64"
        );
        // ================= New Import =================

        const ArbeLogoataUrl = `data:image/jpeg;base64,${ARabLogoBase64}`;
        const leftLogoDataUrl = `data:image/jpeg;base64,${leftLogoBase64}`;
        const headingDataUrl = `data:image/png;base64,${headingBase64}`;
        const verifiedDataUrl = `data:image/png;base64,${verifiedBase64}`;

        const qrCodeDataURL = await QRCode.toDataURL(
          `https://omanpost.doscwallet.com/User/&/page/preview/${documentData.VerificationNo}`
        );

        // 2. Prepare HTML
        const stampHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <style>
              @font-face {
                font-family: 'ArialEmbedded';
                src: url("data:font/truetype;base64,${arialFontBase64}") format("truetype");
              }
              @font-face {
                font-family: 'TimesEmbedded';
                src: url("data:font/truetype;base64,${timesFontBase64}") format("truetype");
                font-weight: normal;
                font-style: normal;
              }



               @font-face {
                font-family: 'RobotoCondensedMedium';
                src: url("data:font/truetype;base64,${RobotoCondensedMediumFontBase64}") format("truetype");
                font-weight: normal;
                font-style: normal;
              }
              @font-face {
                font-family: 'RobotoRegular';
                src: url("data:font/truetype;base64,${RobotoRegularFontBase64}") format("truetype");
                font-weight: normal;
                font-style: normal;
              }
              @font-face {
                font-family: 'RobotoSemiBold';
                src: url("data:font/truetype;base64,${RobotoSemiBoldFontBase64}") format("truetype");
                font-weight: normal;
                font-style: normal;
              }
              @font-face {
                font-family: 'Calibribold';
                src: url("data:font/truetype;base64,${CalibriboldFontBase64}") format("truetype");
                font-weight: normal;
                font-style: normal;
              }
              @font-face {
                font-family: 'BoldTimesNewRoman';
                src: url("data:font/truetype;base64,${TimesNewRomanBolds}") format("truetype");
                font-weight: normal;
                font-style: normal;
              }

              
              body { display: flex; justify-content: center; align-items: flex-start; margin: 0;  font-family: 'ArialEmbedded', sans-serif; -webkit-print-color-adjust: exact; }
              .page-container { background-color: #fff; padding: 1rem 0rem; width: 760px; position: relative; box-sizing: border-box; margin-bottom: -40px; }
              .right-content-wrapper { margin-left: 415px; }
              .seal-container { rotate: 1deg; position: absolute; top: 65px; left: 373px; width: 6.5rem; height: auto; z-index: 10; }
              .seal-image { width: 80%; height: auto; border-radius: 9999px; }
              .certificate-box { border: 1px solid #9ca3af; width: 315px; position: relative; height: 175px; }

              .certificate-main { 
                width: 300px; 
                display: grid; 
                margin-left: 2.5rem; 
                grid-template-columns: 1fr 1fr 1fr; 
                padding: 12px 0rem 1rem 0.1rem; 
                font-size: 0.5rem; 
                row-gap: 2px; 
                white-space: pre-line;
              }
              .arbImage {
                grid-column: 3;
                grid-row: 1 / span 7;
                display: flex;
                justify-content: flex-start;
                align-items: flex-start;
                background-color: green,
                padding-left: 25px;
                margin-left: -16px;
              }
              .arbImage img {
                  width: 72px;
                  height: auto;
              }

              .header-image-container { position: absolute; top: -0.8rem; left: 48%; transform: translateX(-50%); width: 244px; z-index: 10; }
              .header-image { width: 100%;}

              // .data-label-en, .data-value, .data-label-ar { line-height: 1.1; font-size: 10px; }
              .data-label-en, .data-value, .data-label-ar { line-height: 1.1; font-size: 9.3px; }

              // .data-value { font-family: 'RobotoRegular', serif; white-space: pre-wrap; font-weight: 400; margin-left: -50px; }
              .data-value { font-family: 'Calibribold', serif; white-space: pre-wrap; font-weight: 400; margin-left: -50px; }

              // .data-label-en { font-family: 'RobotoRegular', serif; font-weight: 400; }
              .data-label-en { font-family: 'Calibribold', serif; font-weight: 400; }

              .data-label-ar { font-size: 10px; font-weight: 600; text-align: left; direction: rtl; padding-left: 25px; margin-left: -35px; }
              .divider-line { border-top: 1px solid #6b7280; margin-top: 6px; margin-bottom: 5px; width: 380px; margin-left: -110px; }
              .certificate-footer { display: flex; justify-content: flex-end; align-items: center; width: 580px; padding-bottom: 2rem; position: relative; }

              .footer-text { text-align: right; direction: rtl; font-size: 11px; margin-right: 20rem; font-weight: 600; }

              .footer-line { margin: 0.2rem 0; }

              // .footer-mono { font-family: 'TimesEmbedded', serif; letter-spacing: 0.07em; font-size: 0.7rem; font-weight: 600; }
              .footer-mono { font-family: 'BoldTimesNewRoman', serif; letter-spacing: 0.03em; font-size: 0.7rem; font-weight: 600; }
              
              .qr-code-image { position: absolute; bottom: 15px; right: 240px; width: 4.5rem; height: 4.5rem; opacity: 0.8; }
              .blockchain-verified { position: absolute; bottom: 40px; left: 20px; }
              .verified-image { height: 1.3rem; width: auto; }

              .com { font-family: 'RobotoCondensedMedium', serif; font-weight: bold; }
              .att { font-family: 'RobotoCondensedMedium', serif; font-weight: bold; }

              // .qr{ font-family: 'TimesEmbedded', serif; position: absolute; left: -45px; font-size:0.6rem; }
              .qr{ font-family: 'BoldTimesNewRoman', serif; position: absolute; left: -54px; font-size:0.7rem; }

              </style>
          </head>
          <body>
               <div class="page-container">
                   <div class="seal-container"><img src="${leftLogoDataUrl}" alt="Oman Seal" class="seal-image"></div>
                   <div class="blockchain-verified"><img src="${verifiedDataUrl}" alt="Blockchain Icon" class="verified-image"></div>
                   <div class="right-content-wrapper">
                       <div class="certificate-box">
                           <div class="header-image-container"><img src="${headingDataUrl}" alt="Header" class="header-image"></div>

                              <main class="certificate-main">
                                  <div class="data-label-en">e-Verify No</div>
                                  <div class="data-value">${documentData?.TransactionNumber}</div>
                                  
                                  <div class="arbImage">
                                      <img src="${ArbeLogoataUrl}" alt="Arabic Image">
                                  </div>

                                  <div class="data-label-en">Verify By</div>
                                  <div class="data-value">${documentData?.VerifyBy}</div>

                                  <div class="data-label-en">Verify at</div>
                                  <div class="data-value">${documentData?.VerifyAt}</div>

                                  <div class="data-label-en">Applicant <br> Name</div>
                                  <div class="data-value">${documentData?.ApplicantPDFName}</div>

                                  <div class="data-label-en">Document <br> Name</div>
                                  <div class="data-value com-m">${documentData?.DocumentType}</div>

                                  <div class="data-label-en">Date of <br> <span class="att-t">Attestation</span></div>

                                  <div class="data-value">${documentData?.VerificationDateTime}</div>

                                  <div class="data-label-en">Approver <br> Name</div>
                                  <div class="data-value">${documentData?.ApproverName}</div>
                              </main>
                        
                      </div>
                      <div class="divider-line"></div>
                      <footer class="certificate-footer">
                          <div class="footer-text">
    <p class="footer-line">بالرقم تصديق <span class="footer-mono">: ${documentData.TransactionNumber}</span></p>
                              <span class="qr">(QR Code)</span>
                              <p class="footer-line">تم إنجاز المعاملة إلكترونيا و للتأكد من صحة المعاملة يمكنك مسح الباركود</p>
                          </div>
                          <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code-image">
                      </footer>
                  </div>
              </div>
          </body>
          </html>
        `;

        // 3. SMART BROWSER LAUNCH
        let executablePath = undefined;

        if (process.platform === "win32") {
          const possiblePaths = [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            process.env.LOCALAPPDATA +
            "\\Google\\Chrome\\Application\\chrome.exe",
          ];
          for (const p of possiblePaths) {
            if (fsClassic.existsSync(p)) {
              executablePath = p;
              break;
            }
          }
        } else {
          const linuxPaths = [
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/google-chrome",
          ];
          for (const p of linuxPaths) {
            if (fsClassic.existsSync(p)) {
              executablePath = p;
              break;
            }
          }
        }

        browser = await puppeteer.launch({
          headless: true,
          executablePath,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
          ignoreDefaultArgs: ["--disable-extensions"],
        });

        const page = await browser.newPage();
        await page.setContent(stampHtml, {
          waitUntil: "load",
          timeout: 0,
        });

        // 4. GENERATE VECTOR PDF || And Maintain Size bellow.
        await page.waitForTimeout(300);
        const stampPdfBuffer = await page.pdf({
          width: "515px",
          height: "195px",
          // height: "195px",
          printBackground: true,
          pageRanges: "1",
        });

        await browser.close();
        browser = null;

        // 5. MERGE PDFS WITH SHRINKING LOGIC ADDED
        const finalPdfDoc = await PDFDocument.create();
        const originalPdfBytes = await fs.readFile(
          path.join(__dirname, "files", documentData.attestedPDF)
        );
        const originalPdfDoc = await PDFDocument.load(originalPdfBytes);

        const stampPdfDoc = await PDFDocument.load(stampPdfBuffer);
        const [stampPage] = await finalPdfDoc.embedPdf(stampPdfDoc);
        const stampDims = stampPage.scale(1);

        for (const originalPage of originalPdfDoc.getPages()) {
          const { width: origWidth, height: origHeight } = originalPage.getSize();

          // --- SHRINKING LOGIC ---
          const newPageWidth = 1050; // target page width
          const scaledStampHeight = (newPageWidth / stampDims.width) * stampDims.height;
          const stampAreaHeight = scaledStampHeight - 40;

          const scaledContentWidth = 700; // shrink PDF content
          const scaledContentHeight = (scaledContentWidth / origWidth) * origHeight;
          const newPageHeight = scaledContentHeight + stampAreaHeight;
          // --- END SHRINKING LOGIC ---

          const newPage = finalPdfDoc.addPage([newPageWidth, newPageHeight]);
          const embeddedOriginalPage = await finalPdfDoc.embedPage(originalPage);

          newPage.drawPage(embeddedOriginalPage, {
            x: (newPageWidth - scaledContentWidth) / 2,
            y: stampAreaHeight,
            width: scaledContentWidth,
            height: scaledContentHeight,
          });

          newPage.drawPage(stampPage, {
            x: 0,
            // y: -35,
            y: -42,
            width: newPageWidth,
            height: scaledStampHeight,
          });
        }

        const finalPdfBytes = await finalPdfDoc.save();

        // --- Send Response ---
        const disposition =
          req.query.action === "view" ? "inline" : "attachment";
        res.setHeader(
          "Content-Disposition",
          `${disposition}; filename="${documentData.TransactionNumber}.pdf"`
        );
        res.setHeader("Content-Type", "application/pdf");
        res.send(Buffer.from(finalPdfBytes));
      } catch (error) {
        console.error("Failed to generate final PDF:", error);
        if (browser) await browser.close();
        res.status(500).json({
          success: false,
          message: "An error occurred while generating the PDF.",
          detailedError: error.message,
        });
      }
    });

    // I change nfont or other code !!
    // app.get("/download/attested-hq/:id", async (req, res) => {
    //   let browser = null;
    //   try {
    //     const { id } = req.params;
    //     const documentData = await InformationOfUserCollection.findOne({
    //       _id: new ObjectId(id),
    //     });

    //     if (!documentData || !documentData.attestedPDF) {
    //       return res
    //         .status(404)
    //         .send("Document not found or attested PDF is missing.");
    //     }

    //     // 1. Load Assets
    //     const leftLogoBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "EWWE.jpg"),
    //       "base64"
    //     );
    //     const headingBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "Heading.png"),
    //       "base64"
    //     );
    //     const verifiedBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "Verified.png"),
    //       "base64"
    //     );
    //     const arialFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "ARIAL.TTF"),
    //       "base64"
    //     );
    //     const timesFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "times.ttf"),
    //       "base64"
    //     );

    //     // ================= New Import =================
    //     const RobotoCondensedMediumFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "RobotoCondensed-Medium.ttf"),
    //       "base64"
    //     );
    //     const RobotoRegularFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "RobotoCondensed-Regular.ttf"),
    //       "base64"
    //     );
    //     const RobotoSemiBoldFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "RobotoCondensed-SemiBold.ttf"),
    //       "base64"
    //     );
    //     // ================= New Import =================

    //     const leftLogoDataUrl = `data:image/jpeg;base64,${leftLogoBase64}`;
    //     const headingDataUrl = `data:image/png;base64,${headingBase64}`;
    //     const verifiedDataUrl = `data:image/png;base64,${verifiedBase64}`;

    //     const qrCodeDataURL = await QRCode.toDataURL(
    //       `https://omanpost.doscwallet.com/User/&/page/preview/${documentData.VerificationNo}`
    //     );

    //     // 2. Prepare HTML
    //     const stampHtml = `
    //       <!DOCTYPE html>
    //       <html lang="en">
    //       <head>
    //           <meta charset="UTF-8">
    //           <style>
    //           @font-face {
    //             font-family: 'ArialEmbedded';
    //             src: url("data:font/truetype;base64,${arialFontBase64}") format("truetype");
    //           }
    //           @font-face {
    //             font-family: 'TimesEmbedded';
    //             src: url("data:font/truetype;base64,${timesFontBase64}") format("truetype");
    //             font-weight: normal;
    //             font-style: normal;
    //           }



    //            @font-face {
    //             font-family: 'RobotoCondensedMedium';
    //             src: url("data:font/truetype;base64,${RobotoCondensedMediumFontBase64}") format("truetype");
    //             font-weight: normal;
    //             font-style: normal;
    //           }
    //           @font-face {
    //             font-family: 'RobotoRegular';
    //             src: url("data:font/truetype;base64,${RobotoRegularFontBase64}") format("truetype");
    //             font-weight: normal;
    //             font-style: normal;
    //           }
    //           @font-face {
    //             font-family: 'RobotoSemiBold';
    //             src: url("data:font/truetype;base64,${RobotoSemiBoldFontBase64}") format("truetype");
    //             font-weight: normal;
    //             font-style: normal;
    //           }


    //           body { display: flex; justify-content: center; align-items: flex-start; margin: 0;  font-family: 'ArialEmbedded', sans-serif; -webkit-print-color-adjust: exact; }
    //           .page-container { background-color: #fff; padding: 1rem 0rem; width: 760px; position: relative; box-sizing: border-box; margin-bottom: -40px; }
    //           .right-content-wrapper { margin-left: 415px; }
    //           .seal-container { rotate: 1deg; position: absolute; top: 65px; left: 373px; width: 6.5rem; height: auto; z-index: 10; }
    //           .seal-image { width: 80%; height: auto; border-radius: 9999px; }
    //           .certificate-box { border: 1px solid #9ca3af; width: 315px; position: relative; height: 175px; }
    //           .certificate-main { width: 300px; display: grid; margin-left: 2.5rem; grid-template-columns: 1fr 1fr 1fr; padding: 12px 0rem 1rem 0.1rem; font-size: 0.5rem; row-gap: 2px; white-space: pre-line; }

    //           .header-image-container { position: absolute; top: -0.8rem; left: 48%; transform: translateX(-50%); width: 244px; z-index: 10; }
    //           .header-image { width: 100%;}

    //           .ddata-label-en, .data-value, .data-label-ar { line-height: 1.3; font-size: 9px; }
    //           .data-label-en, .data-value, .data-label-ar { line-height: 1.1; font-size: 10px; }

    //           .ddata-value { font-family: 'RobotoRegular', serif; white-space: pre-wrap; font-weight: 400; margin-left: -48px; }
    //           .data-value { font-family: 'RobotoRegular', serif; white-space: pre-wrap; font-weight: 400; margin-left: -50px; }

    //           .data-label-en { font-family: 'RobotoRegular', serif; font-weight: 400; }
    //           .data-label-ar { font-size: 10px; font-weight: 600; text-align: left; direction: rtl; padding-left: 25px; margin-left: -35px; }
    //           .divider-line { border-top: 1px solid #6b7280; margin-top: 6px; margin-bottom: 5px; width: 380px; margin-left: -110px; }
    //           .certificate-footer { display: flex; justify-content: flex-end; align-items: center; width: 580px; padding-bottom: 2rem; position: relative; }
    //           .footer-text { text-align: right; direction: rtl; font-size: 11px; margin-right: 20rem; font-weight: 600; }
    //           .footer-line { margin: 0.2rem 0; }

    //           .footer-mono { font-family: 'TimesEmbedded', serif; letter-spacing: 0.07em; font-size: 0.7rem; font-weight: 600; }
    //           .qr-code-image { position: absolute; bottom: 15px; right: 240px; width: 4.5rem; height: 4.5rem; opacity: 0.8; }
    //           .blockchain-verified { position: absolute; bottom: 40px; left: 20px; }
    //           .verified-image { height: 1.3rem; width: auto; }

    //           .com { font-family: 'RobotoCondensedMedium', serif; font-weight: bold; }
    //           .att { font-family: 'RobotoCondensedMedium', serif; font-weight: bold; }

    //           .qr{ font-family: 'TimesEmbedded', serif; position: absolute; left: -48px; font-size:0.6rem; }
    //           </style>
    //       </head>
    //       <body>
    //            <div class="page-container">
    //                <div class="seal-container"><img src="${leftLogoDataUrl}" alt="Oman Seal" class="seal-image"></div>
    //                <div class="blockchain-verified"><img src="${verifiedDataUrl}" alt="Blockchain Icon" class="verified-image"></div>
    //                <div class="right-content-wrapper">
    //                    <div class="certificate-box">
    //                        <div class="header-image-container"><img src="${headingDataUrl}" alt="Header" class="header-image"></div>
    //                        <main class="certificate-main">
    //                            <div class="data-label-en">e-Verify No</div><div class="data-value">${documentData.TransactionNumber}</div><div class="data-label-ar">رقم التصديق</div>
    //                            <div class="data-label-en">Verify By</div><div class="data-value">${documentData.VerifyBy}</div><div class="data-label-ar">تم التحقق من قبل</div>
    //                            <div class="data-label-en">Verify at</div><div class="data-value">${documentData.VerifyAt}</div><div class="data-label-ar">تم التحقق في</div>
    //                           <div class="data-label-en">Applicant <br>Name</div><div class="data-value">${documentData.ApplicantName}</div><div class="data-label-ar">اسم العميل</div>
    //                           <div class="data-label-en">Document <br> Name</div><div class="data-value com">${documentData.DocumentType}</div><div class="data-label-ar">اسم الوثيقة</div>
    //                           <div class="data-label-en">Date of <br><span class="att">Attestation</span></div><div class="data-value">${documentData.VerificationDateTime}</div><div class="data-label-ar">تاريخ التصديق</div>
    //                           <div class="data-label-en">Approver <br>Name</div><div class="data-value">${documentData.ApproverName}</div><div class="data-label-ar">تمت المصادقة من قبل</div>
    //                       </main>
    //                   </div>
    //                   <div class="divider-line"></div>
    //                   <footer class="certificate-footer">
    //                       <div class="footer-text">
    // <p class="footer-line">بالرقم تصديق <span class="footer-mono">: ${documentData.TransactionNumber}</span></p>
    //                           <span class="qr">(QR Code)</span>
    //                           <p class="footer-line">تم إنجاز المعاملة إلكترونيا و للتأكد من صحة المعاملة يمكنك مسح الباركود</p>
    //                       </div>
    //                       <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code-image">
    //                   </footer>
    //               </div>
    //           </div>
    //       </body>
    //       </html>
    //     `;

    //     // 3. SMART BROWSER LAUNCH
    //     let executablePath = undefined;

    //     if (process.platform === "win32") {
    //       const possiblePaths = [
    //         "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    //         "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    //         process.env.LOCALAPPDATA +
    //         "\\Google\\Chrome\\Application\\chrome.exe",
    //       ];
    //       for (const p of possiblePaths) {
    //         if (fsClassic.existsSync(p)) {
    //           executablePath = p;
    //           break;
    //         }
    //       }
    //     } else {
    //       const linuxPaths = [
    //         "/usr/bin/chromium",
    //         "/usr/bin/chromium-browser",
    //         "/usr/bin/google-chrome-stable",
    //         "/usr/bin/google-chrome",
    //       ];
    //       for (const p of linuxPaths) {
    //         if (fsClassic.existsSync(p)) {
    //           executablePath = p;
    //           break;
    //         }
    //       }
    //     }

    //     browser = await puppeteer.launch({
    //       headless: true,
    //       executablePath,
    //       args: [
    //         "--no-sandbox",
    //         "--disable-setuid-sandbox",
    //         "--disable-dev-shm-usage",
    //         "--disable-gpu",
    //       ],
    //       ignoreDefaultArgs: ["--disable-extensions"],
    //     });

    //     const page = await browser.newPage();
    //     await page.setContent(stampHtml, {
    //       waitUntil: "load",
    //       timeout: 0,
    //     });

    //     // 4. GENERATE VECTOR PDF || And Maintain Size bellow.
    //     await page.waitForTimeout(300);
    //     const stampPdfBuffer = await page.pdf({
    //       width: "515px",
    //       height: "195px",
    //       // height: "195px",
    //       printBackground: true,
    //       pageRanges: "1",
    //     });

    //     await browser.close();
    //     browser = null;

    //     // 5. MERGE PDFS WITH SHRINKING LOGIC ADDED
    //     const finalPdfDoc = await PDFDocument.create();
    //     const originalPdfBytes = await fs.readFile(
    //       path.join(__dirname, "files", documentData.attestedPDF)
    //     );
    //     const originalPdfDoc = await PDFDocument.load(originalPdfBytes);

    //     const stampPdfDoc = await PDFDocument.load(stampPdfBuffer);
    //     const [stampPage] = await finalPdfDoc.embedPdf(stampPdfDoc);
    //     const stampDims = stampPage.scale(1);

    //     for (const originalPage of originalPdfDoc.getPages()) {
    //       const { width: origWidth, height: origHeight } = originalPage.getSize();

    //       // --- SHRINKING LOGIC ---
    //       const newPageWidth = 1050; // target page width
    //       const scaledStampHeight = (newPageWidth / stampDims.width) * stampDims.height;
    //       const stampAreaHeight = scaledStampHeight - 40;

    //       const scaledContentWidth = 700; // shrink PDF content
    //       const scaledContentHeight = (scaledContentWidth / origWidth) * origHeight;
    //       const newPageHeight = scaledContentHeight + stampAreaHeight;
    //       // --- END SHRINKING LOGIC ---

    //       const newPage = finalPdfDoc.addPage([newPageWidth, newPageHeight]);
    //       const embeddedOriginalPage = await finalPdfDoc.embedPage(originalPage);

    //       newPage.drawPage(embeddedOriginalPage, {
    //         x: (newPageWidth - scaledContentWidth) / 2,
    //         y: stampAreaHeight,
    //         width: scaledContentWidth,
    //         height: scaledContentHeight,
    //       });

    //       newPage.drawPage(stampPage, {
    //         x: 0,
    //         // y: -35,
    //         y: -42,
    //         width: newPageWidth,
    //         height: scaledStampHeight,
    //       });
    //     }

    //     const finalPdfBytes = await finalPdfDoc.save();

    //     // --- Send Response ---
    //     const disposition =
    //       req.query.action === "view" ? "inline" : "attachment";
    //     res.setHeader(
    //       "Content-Disposition",
    //       `${disposition}; filename="${documentData.TransactionNumber}.pdf"`
    //     );
    //     res.setHeader("Content-Type", "application/pdf");
    //     res.send(Buffer.from(finalPdfBytes));
    //   } catch (error) {
    //     console.error("Failed to generate final PDF:", error);
    //     if (browser) await browser.close();
    //     res.status(500).json({
    //       success: false,
    //       message: "An error occurred while generating the PDF.",
    //       detailedError: error.message,
    //     });
    //   }
    // });

    // Previous Orgima Code off make developer !!
    // app.get("/download/attested-hq/:id", async (req, res) => {
    //   let browser = null;
    //   try {
    //     const { id } = req.params;
    //     const documentData = await InformationOfUserCollection.findOne({
    //       _id: new ObjectId(id),
    //     });

    //     if (!documentData || !documentData.attestedPDF) {
    //       return res
    //         .status(404)
    //         .send("Document not found or attested PDF is missing.");
    //     }

    //     // 1. Load Assets
    //     const leftLogoBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "EWWE.jpg"),
    //       "base64"
    //     );
    //     const headingBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "Heading.png"),
    //       "base64"
    //     );
    //     const verifiedBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "Verified.png"),
    //       "base64"
    //     );
    //     const arialFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "ARIAL.TTF"),
    //       "base64"
    //     );
    //     const timesFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "times.ttf"),
    //       "base64"
    //     );

    //     // ================= New Import =================
    //     const RobotoMediumFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "RobotoCondensed-Medium.ttf"),
    //       "base64"
    //     );
    //     const RobotoRegularFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "RobotoCondensed-Regular.ttf"),
    //       "base64"
    //     );
    //     const RobotoSemiBoldFontBase64 = await fs.readFile(
    //       path.join(__dirname, "assets", "RobotoCondensed-SemiBold.ttf"),
    //       "base64"
    //     );
    //     // ================= New Import =================

    //     const leftLogoDataUrl = `data:image/jpeg;base64,${leftLogoBase64}`;
    //     const headingDataUrl = `data:image/png;base64,${headingBase64}`;
    //     const verifiedDataUrl = `data:image/png;base64,${verifiedBase64}`;

    //     const qrCodeDataURL = await QRCode.toDataURL(
    //       `https://omanpost.doscwallet.com/User/&/page/preview/${documentData.VerificationNo}`
    //     );

    //     // 2. Prepare HTML
    //     const stampHtml = `
    //       <!DOCTYPE html>
    //       <html lang="en">
    //       <head>
    //           <meta charset="UTF-8">
    //           <style>
    //           @font-face {
    //             font-family: 'ArialEmbedded';
    //             src: url("data:font/truetype;base64,${arialFontBase64}") format("truetype");
    //           }
    //           @font-face {
    //             font-family: 'TimesEmbedded';
    //             src: url("data:font/truetype;base64,${timesFontBase64}") format("truetype");
    //             font-weight: normal;
    //             font-style: normal;
    //           }

    //           body { display: flex; justify-content: center; align-items: flex-start; margin: 0;  font-family: 'ArialEmbedded', sans-serif; -webkit-print-color-adjust: exact; }
    //           .page-container { background-color: #fff; padding: 1rem 0rem; width: 760px; position: relative; box-sizing: border-box; margin-bottom: -40px; }
    //           .right-content-wrapper { margin-left: 415px; }
    //           .seal-container { rotate: 1deg; position: absolute; top: 65px; left: 373px; width: 6.5rem; height: auto; z-index: 10; }
    //           .seal-image { width: 80%; height: auto; border-radius: 9999px; }
    //           .certificate-box { border: 1px solid #9ca3af; width: 315px; position: relative; height: 175px; }
    //           .certificate-main { width: 300px; display: grid; margin-left: 2.5rem; grid-template-columns: 1fr 1fr 1fr; padding: 12px 0rem 1rem 0.1rem; font-size: 0.5rem; row-gap: 2px; white-space: pre-line; }
    //           .header-image-container { position: absolute; top: -0.8rem; left: 48%; transform: translateX(-50%); width: 244px; z-index: 10; }
    //           .header-image { width: 100%;}
    //           .data-label-en, .data-value, .data-label-ar { line-height: 1.3; font-size: 9px; }
    //           .data-value { white-space: pre-wrap; font-weight: 400; margin-left: -48px; }

    //           .data-label-en { font-weight: 400; }
    //           .data-label-ar { font-size: 10px; font-weight: 600; text-align: left; direction: rtl; padding-left: 25px; margin-left: -35px; }


    //           .divider-line { border-top: 1px solid #6b7280; margin-top: 6px; margin-bottom: 5px; width: 380px; margin-left: -110px; }
    //           .certificate-footer { display: flex; justify-content: flex-end; align-items: center; width: 580px; padding-bottom: 2rem; position: relative; }
    //           .footer-text { text-align: right; direction: rtl; font-size: 11px; margin-right: 20rem; font-weight: 600; }
    //           .footer-line { margin: 0.2rem 0; }

    //           .footer-mono { font-family: 'TimesEmbedded', serif; letter-spacing: 0.07em; font-size: 0.7rem; font-weight: 600; }

    //           .qr-code-image { position: absolute; bottom: 15px; right: 240px; width: 4.5rem; height: 4.5rem; opacity: 0.8; }
    //           .blockchain-verified { position: absolute; bottom: 40px; left: 20px; }
    //           .verified-image { height: 1.3rem; width: auto; }
    //           .com { font-weight: bold; }
    //           .att { font-weight: bold; }
    //           .qr{ font-family: 'TimesEmbedded', serif; position: absolute; left: -48px; font-size:0.6rem; }
    //           </style>
    //       </head>
    //       <body>
    //            <div class="page-container">
    //                <div class="seal-container"><img src="${leftLogoDataUrl}" alt="Oman Seal" class="seal-image"></div>
    //                <div class="blockchain-verified"><img src="${verifiedDataUrl}" alt="Blockchain Icon" class="verified-image"></div>
    //                <div class="right-content-wrapper">
    //                    <div class="certificate-box">
    //                        <div class="header-image-container"><img src="${headingDataUrl}" alt="Header" class="header-image"></div>
    //                        <main class="certificate-main">
    //                            <div class="data-label-en">e-Verify No.</div><div class="data-value">${documentData.TransactionNumber}</div><div class="data-label-ar">رقم التصديق</div>
    //                            <div class="data-label-en">Verify By</div><div class="data-value">${documentData.VerifyBy}</div><div class="data-label-ar">تم التحقق من قبل</div>
    //                            <div class="data-label-en">Verify at</div><div class="data-value">${documentData.VerifyAt}</div><div class="data-label-ar">تم التحقق في</div>
    //                           <div class="data-label-en">Applicant <br>Name</div><div class="data-value">${documentData.ApplicantName}</div><div class="data-label-ar">اسم العميل</div>
    //                           <div class="data-label-en">Document <br> Name</div><div class="data-value com">${documentData.DocumentType}</div><div class="data-label-ar">اسم الوثيقة</div>
    //                           <div class="data-label-en">Date of <br><span class="att">Attestation</span></div><div class="data-value">${documentData.VerificationDateTime}</div><div class="data-label-ar">تاريخ التصديق</div>
    //                           <div class="data-label-en">Approver <br>Name</div><div class="data-value">${documentData.ApproverName}</div><div class="data-label-ar">تمت المصادقة من قبل</div>
    //                       </main>
    //                   </div>
    //                   <div class="divider-line"></div>
    //                   <footer class="certificate-footer">
    //                       <div class="footer-text">
    // <p class="footer-line">بالرقم تصديق <span class="footer-mono">: ${documentData.TransactionNumber}</span></p>
    //                           <span class="qr">(QR Code)</span>
    //                           <p class="footer-line">تم إنجاز المعاملة إلكترونيا و للتأكد من صحة المعاملة يمكنك مسح الباركود</p>
    //                       </div>
    //                       <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code-image">
    //                   </footer>
    //               </div>
    //           </div>
    //       </body>
    //       </html>
    //     `;

    //     // 3. SMART BROWSER LAUNCH
    //     let executablePath = undefined;

    //     if (process.platform === "win32") {
    //       const possiblePaths = [
    //         "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    //         "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    //         process.env.LOCALAPPDATA +
    //         "\\Google\\Chrome\\Application\\chrome.exe",
    //       ];
    //       for (const p of possiblePaths) {
    //         if (fsClassic.existsSync(p)) {
    //           executablePath = p;
    //           break;
    //         }
    //       }
    //     } else {
    //       const linuxPaths = [
    //         "/usr/bin/chromium",
    //         "/usr/bin/chromium-browser",
    //         "/usr/bin/google-chrome-stable",
    //         "/usr/bin/google-chrome",
    //       ];
    //       for (const p of linuxPaths) {
    //         if (fsClassic.existsSync(p)) {
    //           executablePath = p;
    //           break;
    //         }
    //       }
    //     }

    //     browser = await puppeteer.launch({
    //       headless: true,
    //       executablePath,
    //       args: [
    //         "--no-sandbox",
    //         "--disable-setuid-sandbox",
    //         "--disable-dev-shm-usage",
    //         "--disable-gpu",
    //       ],
    //       ignoreDefaultArgs: ["--disable-extensions"],
    //     });

    //     const page = await browser.newPage();
    //     await page.setContent(stampHtml, {
    //       waitUntil: "load",
    //       timeout: 0,
    //     });

    //     // 4. GENERATE VECTOR PDF || And Maintain Size bellow.
    //     await page.waitForTimeout(300);
    //     const stampPdfBuffer = await page.pdf({
    //       width: "515px",
    //       height: "195px",
    //       // height: "195px",
    //       printBackground: true,
    //       pageRanges: "1",
    //     });

    //     await browser.close();
    //     browser = null;

    //     // 5. MERGE PDFS WITH SHRINKING LOGIC ADDED
    //     const finalPdfDoc = await PDFDocument.create();
    //     const originalPdfBytes = await fs.readFile(
    //       path.join(__dirname, "files", documentData.attestedPDF)
    //     );
    //     const originalPdfDoc = await PDFDocument.load(originalPdfBytes);

    //     const stampPdfDoc = await PDFDocument.load(stampPdfBuffer);
    //     const [stampPage] = await finalPdfDoc.embedPdf(stampPdfDoc);
    //     const stampDims = stampPage.scale(1);

    //     for (const originalPage of originalPdfDoc.getPages()) {
    //       const { width: origWidth, height: origHeight } = originalPage.getSize();

    //       // --- SHRINKING LOGIC ---
    //       const newPageWidth = 1050; // target page width
    //       const scaledStampHeight = (newPageWidth / stampDims.width) * stampDims.height;
    //       const stampAreaHeight = scaledStampHeight - 40;

    //       const scaledContentWidth = 700; // shrink PDF content
    //       const scaledContentHeight = (scaledContentWidth / origWidth) * origHeight;
    //       const newPageHeight = scaledContentHeight + stampAreaHeight;
    //       // --- END SHRINKING LOGIC ---

    //       const newPage = finalPdfDoc.addPage([newPageWidth, newPageHeight]);
    //       const embeddedOriginalPage = await finalPdfDoc.embedPage(originalPage);

    //       newPage.drawPage(embeddedOriginalPage, {
    //         x: (newPageWidth - scaledContentWidth) / 2,
    //         y: stampAreaHeight,
    //         width: scaledContentWidth,
    //         height: scaledContentHeight,
    //       });

    //       newPage.drawPage(stampPage, {
    //         x: 0,
    //         // y: -35,
    //         y: -42,
    //         width: newPageWidth,
    //         height: scaledStampHeight,
    //       });
    //     }

    //     const finalPdfBytes = await finalPdfDoc.save();

    //     // --- Send Response ---
    //     const disposition =
    //       req.query.action === "view" ? "inline" : "attachment";
    //     res.setHeader(
    //       "Content-Disposition",
    //       `${disposition}; filename="${documentData.TransactionNumber}.pdf"`
    //     );
    //     res.setHeader("Content-Type", "application/pdf");
    //     res.send(Buffer.from(finalPdfBytes));
    //   } catch (error) {
    //     console.error("Failed to generate final PDF:", error);
    //     if (browser) await browser.close();
    //     res.status(500).json({
    //       success: false,
    //       message: "An error occurred while generating the PDF.",
    //       detailedError: error.message,
    //     });
    //   }
    // });

    // ==================================================================
    // All Database Code End
    // ==================================================================

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// ============================================
// Database Connect Code  End
// ============================================

app.get("/", (req, res) => {
  res.send("OMANPOS Website trhird number project is running");
});

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
