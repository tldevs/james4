require("dotenv").config();
const { ethers } = require("ethers");
const cron = require("node-cron");
const Web3 = require("web3");
const db = require("./app/models");
const Claim = db.claim;
const TLLPAbi = require("./app/abi/TLLP.json");

// Connect to DB
db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

// Schedule tasks to be run on the server.
cron.schedule("* * * * *", function () {
  console.log("running a task every minute");
  run();
});

async function run() {
  try {
    const web3BSC = new Web3(process.env.BSC_RPC);
    const web3TLC = new Web3(process.env.TLC_RPC);
    const claims = await Claim.find({ paid: false });
    console.log("Claims: ", claims);

    for (var i = 0; i < claims.length; i++) {
      let txhash = claims[i].txhash;
      const txType = claims[i].txType;
      let tx;
      console.log("TxType: ", txType);

      tx = await web3BSC.eth.getTransactionReceipt(txhash);
      if (tx && tx.from) {
        // Validate the transaction
        if (
          tx.from.toLowerCase() != claims[i].address.toLowerCase() ||
          tx.status == false
        ) {
          console.log("failed transaction");
        } else {
          // Send TLC
          // After the coin listing, don't forget to change the value of TLC
          if (txType === "USDT_TLLP") {
            await sendTLLP(claims[i].address, claims[i].amount / 4.89);
            updateClaim(claims[i].id);
          } else {
            await sendTLC(claims[i].address, claims[i].amount / 4.89);
            updateClaim(claims[i].id);
          }
        }
      }
    }
  } catch (error) {
    console.log("Error on run():", error);
  }
}

// Sent TLC to customer
async function sendTLC(toAddress, amount) {
  try {
    const web3TLC = new Web3(process.env.TLC_RPC);
    const privKey = process.env.PRIV_KEY;

    console.log("here1");
    const createTransaction = await web3TLC.eth.accounts.signTransaction(
      {
        from: process.env.OWNER_ADDRESS,
        to: toAddress,
        value: web3TLC.utils.toWei(amount.toString(), "ether"),
        gas: "21000",
      },
      privKey
    );
    console.log("here2");

    // Deploy transaction
    const createReceipt = await web3TLC.eth.sendSignedTransaction(
      createTransaction.rawTransaction
    );
    console.log("Create receipt: ", createReceipt);
  } catch (error) {
    console.log("Error on sendTLC():", error);
  }
}

// Sent TLC to customer
async function sendTLLP(toAddress, amount) {
  // try {
  const tlcProvider = new ethers.providers.JsonRpcProvider(process.env.TLC_RPC);
  const wallet = new ethers.Wallet(
    process.env.TLLP_OWNER_PRIV_KEY,
    tlcProvider
  );
  const TLLPTokenAddress = "0xd887f0837949310C0D174989b7145B83636fE731";
  const contract = new ethers.Contract(TLLPTokenAddress, TLLPAbi.abi, wallet);
  const totalAmount = ethers.utils.parseUnits(amount.toString(), "ether");
  const unsignedTx = await contract.populateTransaction.transfer(
    toAddress,
    totalAmount
  );

  const tx = await wallet.sendTransaction(unsignedTx);
  const receipt = await tx.wait();
}
// Mark a claim as paid
function updateClaim(id) {
  try {
    Claim.findByIdAndUpdate(id, { paid: true }, { useFindAndModify: false })
      .then((data) => {
        if (!data) {
          const msg = `Cannot update Claim with id=${id}`;
          throw new Error(msg);
          console.log(msg);
        } else console.log("Claim was updated successfully");
      })
      .catch((err) => {
        const msg = "Error updating Claim with id=" + id;
        throw new Error(msg);
        console.log(msg);
      });
  } catch (error) {
    console.log("Error on updateClaim():", error);
  }
}
