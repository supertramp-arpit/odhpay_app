npx create-expo-app@latest MyBlankApp --template blank


adb install android/app/build/outputs/apk/release/app-release.apk


npm install expo-updates@latest


<!--Create a channel for publish  -->
npx eas channel:create

    npx expo-updates codesigning:generate --key-output-directory ./certs --certificate-output-directory ./certs --certificate-common-name "lcr-prod" --certificate-validity-duration-years 10

    
eas update:list



eas update --branch production --message "Register Screen" --private-key-path .\certs\private-key.pem


<!-- Tell you about update -->
npx eas branch:list


<!--Test update in Release apk  -->
adb logcat -s dev.expo.updates,ExpoUpdates,ReactNativeJS



adb install android/app/build/outputs/apk/debug/app-debug.apk








I see you're using react-native-sms-retriever. The issue with OTP auto-read not working on all phones is typically due to:

SMS Retriever API requires an app hash in the SMS message
User Consent API has limitations on some OEMs (Xiaomi, Oppo, Vivo, etc.)
Google Play Services version differences




PowerShell
keytool -importcert -file deployment_cert.der -keystore temporary.keystore -alias PlayDeploymentCert

Git Bash
./sms_retriever_hash_v9.sh --package "com.package.name" --keystore temporary.keystore





{"data": ["Agent Collection", "Broadband Postpaid", "Cable TV", "Clubs and Associations", "Credit Card", "Donation", "DTH", "eChallan", "Education Fees", "Electricity", "EV Recharge", "Fastag", "Fleet Card Recharge", "Gas", "Housing society", "Housing Society", "Insurance", "Landline Postpaid", "Loan Repayment", "LPG Gas", "Mobile Postpaid", "Mobile Prepaid", "Municipal Services", "Municipal Taxes", "National Pension System", "NCMC Recharge", "Prepaid Meter", "Recurring Deposit", "Rental", "Subscription", "Water"], "message": "Categories fetched successfully", "success": true}