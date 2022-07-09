import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import erc20Abi from "../contract/erc20.abi.json";
import mentorlyAbi from "../contract/mentorly.abi.json";

let kit;
let contract;
let user;
let mentors = [];

const ERC20_DECIMALS = 18;
const mentorlyContractAddress = "0xA98d67794ef1624AAB84eE9B342437aAc0877cEB";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

// NOTIFCATION
function notice(notice) {
  const notificationText = document.querySelector(".notification p");
  const notificationContainer = document.querySelector(".notification");
  notificationContainer.classList.replace("hide", "show");

  notificationText.textContent = notice;
}
function noticeOff() {
  const notificationContainer = document.querySelector(".notification");
  notificationContainer.classList.replace("show", "hide");
}
// ENDS HERE

// CELO ACCOUNT BALANCE
async function userBalance() {
  const balanceContainer = document.querySelector(".wallet_balance");

  const bal = await kit.getTotalBalance(kit.defaultAccount); //Get account total balance
  const cUSDBal = bal.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2); //Converting it to cUSD

  const userCeloBal = `
    ${cUSDBal} cUSD
  `;
  balanceContainer.textContent = userCeloBal; //Posting the user's balance on the frontend
}
// ENDS HERE

// CONNECTING TO WALLET
const connectWalletBtn = document.querySelectorAll(".connect_wallet");
const navConnectWalletBtn = document.querySelector(".connect_wallet_btn");
const userWalletDetails = document.querySelector(".user_details");
const homepageBtn = document.querySelector(".homepage_btn");
const connectedBtn = document.querySelector(".connected_btn");
const navUserWalletAddress = document.querySelector(".wallet_address");
const navUserIdenticon = document.querySelector(".identicon_img");

// Function to collect to user's celo wallet
async function connectToWallet() {
  if (window.celo) {
    notice("Connecting to wallet...");

    try {
      await window.celo.enable(); //checking if celo extension is enable in the browser
      notice("Connected!!!");

      const web3 = new Web3(window.celo); //creating a web3 instance
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();

      kit.defaultAccount = accounts[0]; //getting logged in account
      user = kit.defaultAccount;
      contract = new kit.web3.eth.Contract( //creating a contract instance using the abi and contract address
        mentorlyAbi,
        mentorlyContractAddress
      );
      noticeOff();
    } catch (error) {
      notice(error);
    }
  } else {
    notice("Please install the CeloExtensionWallet..."); //display if celo extension is not installed
  }
  noticeOff();
}
// Ends here

// Coonection to the wallet
connectWalletBtn.forEach((btn) => {
  btn.addEventListener("click", async function () {
    await connectToWallet();
    await userBalance();
    homepageBtn.classList.replace("show", "hide");
    navConnectWalletBtn.classList.replace("show", "hide");

    const editUserWalletAddress = user.slice(0, 7); // modified wallet address
    navUserWalletAddress.textContent = `${editUserWalletAddress}....`; //displaying the modified wallet address

    navUserIdenticon.innerHTML = identiconTemplate(user);

    connectedBtn.classList.replace("hide", "show");
    userWalletDetails.classList.replace("hide", "show");
  });
});
// Ends here

// ENDS HERE

// VIEW MENTORS AVAILABLE
const menteeBtn = document.querySelector(".mentee_app");
const mentorsContainer = document.querySelector(".mentors_container");
const header = document.querySelector("header");

menteeBtn.addEventListener("click", async function () {
  mentorsContainer.classList.replace("hide", "show");
  header.classList.replace("show", "hide");

  notice("Loading available mentors, please wait");
  await connectToWallet();
  await userBalance();
  storedMentors();
  noticeOff();
});
// ENDS HERE

// MENTOR APPLICATION

// Valid User Input Function
function validInput(name, expertise, price) {
  if (name && expertise && price) {
    return true;
  } else {
    return false;
  }
}
// Ends Here

// Variables used
const applyAsMentorBtn = document.querySelector(".mentor_app");
const mentorSignupForm = document.querySelector(".signup_form");
const submitBtn = document.querySelector(".submit");
const cancelBtn = document.querySelector(".cancel");
// Ends here

// show apply form
applyAsMentorBtn.addEventListener("click", function () {
  mentorSignupForm.classList.replace("hide", "show");
});
// ends here

// Submit form and uploading mentor
submitBtn.addEventListener("click", async function (e) {
  e.preventDefault();

  // form input fiels values
  const mentorName = document.querySelector(".mentor_name input").value;
  const mentorImg = document.querySelector(".mentor_img input").value;
  const mentorExpertise = document.querySelector(".mentor_expertise input")
    .value;
  const mentorPrice = document.querySelector(".mentor_price input").value;
  // ends here

  const mentor = [
    mentorName,
    mentorExpertise,
    mentorImg,
    new BigNumber(mentorPrice).shiftedBy(ERC20_DECIMALS).toString()
  ];

  if (validInput(mentorName, mentorExpertise, mentorPrice)) {
    notice(`Adding a new mentor please wait`);

    // connecting to the smart contract to access the upload function
    try {
      const result = await contract.methods //connecting to the contract to get access to the uploadMentor function
        .uploadMentor(...mentor)
        .send({ from: kit.defaultAccount });

      notice(`You've been successfully added as a mentor`);

      mentorSignupForm.classList.replace("show", "hide");
      header.classList.replace("show", "hide");

      mentorsContainer.classList.replace("hide", "show");
    } catch (error) {
      notice(
        `Oops, sorry but we couldn't add you as a mentor, please try again later`
      );
    }
    storedMentors();
    noticeOff();
    // ends here
  } else {
    notice("wrong input, check submitted details");
  }
});
// Ends Here

// Cancel form
cancelBtn.addEventListener("click", function (e) {
  e.preventDefault();
  mentorSignupForm.classList.replace("show", "hide");
});
// Ends Here

// ENDS HERE

// DISPLAY UPLOADED MENTORS

// Mentor Template
function mentorTemplate(mentor) {
  return `
    <div class="name_img">
      <h2 class="name">${mentor.name} <span>${mentor.mentee} mentees</span></h2>
      ${identiconTemplate(mentor.owner)}
    </div>

    <div class="expertise">
      <p>${mentor.expertise}</p>
    </div>

    <div class="price">
      <h3>sesson price</h3>
      <p>${mentor.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)}cUSD/h</p>
    </div>

    <div class="book">
      <button id="${mentor.index}" class="book_session">Book Session</button>
    </div>
  `;
}
// Ends Here

// Identicon Template
function identiconTemplate(address) {
  const icon = blockies
    .create({
      seed: address,
      size: 8,
      scale: 16
    })
    .toDataURL();

  return `
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${address}">
    </a>
  `;
}
// Ends Here

// Display Mentors
function uploadedMentors() {
  const mentorsContainer = document.querySelector(".mentors");
  mentorsContainer.innerHTML = "";
  if (mentors.length < 1) {
    const newMentor = document.createElement("h1");
    newMentor.innerHTML = "No Mentors Available";
    mentorsContainer.appendChild(newMentor);
  } else {
    mentors.forEach((mentor) => {
      const newMentor = document.createElement("div");
      newMentor.className = "mentor";
      newMentor.innerHTML = mentorTemplate(mentor);

      mentorsContainer.appendChild(newMentor);
    });
  }
}
// Ends Here

// ENDS HERE

// GET UPLOADED MENTORS
async function storedMentors() {
  const mentorsLength = await contract.methods.getMentorsLength().call();
  const mentorArray = [];

  for (let i = 0; i < mentorsLength; i++) {
    let newMentor = new Promise(async function (resolve, reject) {
      let mentorData = await contract.methods.readMentors(i).call(); //accessing the readMentor function and assigning the data to a variable

      resolve({
        index: i,
        owner: mentorData[0],
        name: mentorData[1],
        expertise: mentorData[2],
        price: new BigNumber(mentorData[4]),
        mentee: mentorData[5]
      });
      reject((err) => {
        notice("Error: " + err);
      });
    });
    mentorArray.push(newMentor); //pushing all available mentors into an array
  }

  mentors = await Promise.all(mentorArray); //initializing the mentors variable to the new array containing the mentors
  uploadedMentors();
}
// ENDS HERE

// BOOK A SESSION

// Verify Booking
async function sessionBookingApproval(mentorPrice) {
  notice("Verifying and approving booking");
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods //approving contracts transaction
    .approve(mentorlyContractAddress, mentorPrice)
    .send({ from: kit.defaultAccount });

  notice("Booking verified and approved");
  return result;
}
// Ends Here

// Book The Session
const mentorLists = document.querySelector(".mentors");

mentorLists.addEventListener("click", async function (e) {
  if (e.target.id) {
    const mentorIndex = e.target.id;

    try {
      await sessionBookingApproval(mentors[mentorIndex].price);
      notice("Booking in progress, please wait");
    } catch (error) {
      notice("Sorry, but we could not verify the transaction");
    }

    try {
      const result = await contract.methods
        .bookMentor(mentorIndex)
        .send({ from: kit.defaultAccount });

      notice(`Successfully booked a session with ${mentors[mentorIndex].name}`);

      await storedMentors();
      await userBalance();
      noticeOff();
    } catch (error) {
      notice("Error " + error);
    }
  }
});
// Ends Here

// ENDS HERE
