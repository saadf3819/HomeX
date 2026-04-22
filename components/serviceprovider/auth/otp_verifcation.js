// import React, { useRef, useState } from "react";
// import { View, Text, TextInput, Button } from "react-native";
// import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
// import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
// import { auth } from "../../../integrations/firebase";

// export default function OTPVerification() {
//   const recaptchaVerifier = useRef(null);
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [verificationId, setVerificationId] = useState(null);
//   const [otp, setOtp] = useState("");

//   const sendVerification = async () => {
//     try {
//       const phoneProvider = new PhoneAuthProvider(auth);
//       const verificationId = await phoneProvider.verifyPhoneNumber(
//         phoneNumber,
//         recaptchaVerifier.current
//       );
//       setVerificationId(verificationId);
//       alert("Verification code sent!");
//     } catch (err) {
//       console.error(err);
//       alert("Error sending code.");
//     }
//   };

//   const confirmCode = async () => {
//     try {
//       const credential = PhoneAuthProvider.credential(verificationId, otp);
//       await signInWithCredential(auth, credential);
//       alert("Phone number verified!");
//     } catch (err) {
//       console.error(err);
//       alert("Invalid code.");
//     }
//   };

//   return (
//     <View style={{ flex: 1, padding: 20 }}>
//       <FirebaseRecaptchaVerifierModal
//         ref={recaptchaVerifier}
//         firebaseConfig={auth.app.options}
//       />

//       <Text>Enter Phone Number:</Text>
//       <TextInput
//         placeholder="+92 300 1234567"
//         onChangeText={setPhoneNumber}
//         value={phoneNumber}
//         keyboardType="phone-pad"
//         style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
//       />
//       <Button title="Send OTP" onPress={sendVerification} />

//       {verificationId && (
//         <>
//           <Text>Enter OTP:</Text>
//           <TextInput
//             placeholder="123456"
//             onChangeText={setOtp}
//             value={otp}
//             keyboardType="number-pad"
//             style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
//           />
//           <Button title="Verify OTP" onPress={confirmCode} />
//         </>
//       )}
//     </View>
//   );
// }
