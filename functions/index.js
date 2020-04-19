const REGION = process.env.REGION || "europe-west1";

const functions = require("firebase-functions").region(REGION);
const admin = require("firebase-admin");
const cors = require("cors")({
  // origin: true
});
const sha256 = require("crypto-js/sha256");
const Base64 = require("crypto-js/enc-base64");

const createProfile = require("./lib/create-profile");
const action = require("./lib/action");
const joinTable = require("./lib/join-table");
const leaveTable = require("./lib/leave-table");

const { JOIN, LEAVE, REQUESTED_INVOICE } = require("./lib/types");

if (process.env.FUNCTIONS_EMULATOR) {
  // load config from services....
  const serviceAccount = require("../services/lightning-poker-firebase-adminsdk-pdomv-82e6bf58f2.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else admin.initializeApp();

exports.action = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    const { type } = request.body || {};
    if (!type) {
      return response.send({});
    }

    try {
      if (type === JOIN) {
        await joinTable(admin.firestore(), request.body);
      } else if (type === LEAVE) {
        await leaveTable(admin.firestore(), request.body);
      } else {
        await action(admin.firestore(), request.body);
      }
      return response.send({ success: true });
    } catch (e) {
      return response.status(500).send({ error: e.message });
    }
  });
});

exports.actionf = functions.firestore
  .document("/actions/{documentId}")
  .onCreate(async (snap) => {
    const { type } = snap.data();

    console.log(snap.data());

    try {
      if (type === JOIN) {
        await joinTable(admin.firestore(), snap.data());
      } else if (type === LEAVE) {
        await leaveTable(admin.firestore(), snap.data());
      } else {
        await action(admin.firestore(), snap.data());
      }
    } catch (e) {
      console.log(e.message);
    }
  });

exports.lnurlpay = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    let { profileId, amount: msatoshi } = request.query;

    const metadata = JSON.stringify([
      ["text/plain", `Fund account ${profileId} on lightning-poker.com`],
      [
        "image/png;base64",
        "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",
      ],
    ]);

    try {
      if (msatoshi) {
        // return invoice
        let ref = await admin
          .firestore()
          .collection("invoices")
          .add({
            tokens: Math.floor(Number(msatoshi) / 1000),
            profileId,
            descriptionHash: Base64.stringify(sha256(metadata)),
            state: REQUESTED_INVOICE,
          });

        let request = await new Promise((resolve, reject) => {
          let unsubscribe = ref.onSnapshot((snap) => {
            let request = snap.get("payment_request");
            if (request) {
              unsubscribe();
              resolve(request);
            }
          }, reject);
        });

        return response.send({
          pr: request,
          disposable: false,
        });
      } else {
        // return params
        return response.send({
          callback: `https://${request.get(
            "host"
          )}/lnurlpay?profileId=${profileId}`,
          maxSendable: 1000000000,
          minSendable: 1000,
          metadata,
          tag: "payRequest",
          routes: [],
        });
      }
    } catch (e) {
      return response.status(200).send({ status: "ERROR", reason: e.message });
    }
  });
});

exports.lnurlwithdraw = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    let { profileId, pr = null } = request.query;

    try {
      // get profile balance
      const profileSnap = await admin
        .firestore()
        .collection("profiles")
        .doc(profileId)
        .get();

      console.log(profileSnap, profileSnap.data())

      const { balance = 0, withdrawLock = false } = profileSnap.data();

      if (balance < 1 || withdrawLock) {
        throw new Error("No balance to withdraw!");
      }

      if (pr) {
        // an invoice was sent, process the withdraw
        let ref = await admin
          .firestore()
          .collection("payments")
          .add({
            payment_request: pr,
            profileId,
            state: REQUESTED_PAYMENT
          });
      } else {
        // just return the withdraw params
        return response.send({
          callback: `https://${request.get(
            "host"
          )}/lnurlwithdraw?profileId=${profileId}`,
          maxWithdrawable: balance * 1000,
          minWithdrawable: 1000,
          k1: "",
          tag: "withdrawRequest",
        });
      }
    } catch (e) {
      return response.status(200).send({ status: "ERROR", reason: e.message });
    }
  });
});

exports.createProfile = functions.auth
  .user()
  .onCreate(createProfile(admin.firestore()));
