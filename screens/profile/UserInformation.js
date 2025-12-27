import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useSharedValue, withSpring, withTiming, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { ArrowLeft, ChevronDown, X, Check, Eye } from 'lucide-react-native';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Image, Modal, Pressable, TextInput, Platform, InteractionManager } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NomineSuccess } from '../../components/profile/NomineSuccess';
import { useNavigation } from '@react-navigation/native';
import { useKycDetailStore } from '../../store/useKycStore';
import { useRegisterStore } from '../../store';
import useUserStore from '../../store/useUserStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


function formatDateToDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const cleaned = String(dateStr).trim();
  const datePart = cleaned.includes("T")
    ? cleaned.split("T")[0]
    : cleaned.split(" ")[0] || cleaned;
  const separator = datePart.includes("-") ? "-" : datePart.includes("/") ? "/" : null;
  if (!separator) return datePart;
  const [a, b, c] = datePart.split(separator);
  if (!a || !b || !c) return datePart;
  if (a.length === 4) {
    return `${c.padStart(2, "0")}-${b.padStart(2, "0")}-${a}`;
  }
  return `${a.padStart(2, "0")}-${b.padStart(2, "0")}-${c}`;
}



const THEME = {
  colors: {
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    secondary: '#1E40AF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FAFBFC',
    card: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      muted: '#94A3B8',
      inverse: '#FFFFFF',
    },
    accent: '#8B5CF6',
    accentLight: '#A78BFA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

// Modern Modal Component

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);


const ModernModal = React.memo(({ visible, onClose, title, children }) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const animateIn = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 220 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, [backdropOpacity, translateY]);

  const animateOut = useCallback((onDone) => {
    backdropOpacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
      runOnJS(onDone)();
    });
  }, [backdropOpacity, translateY]);

  useEffect(() => { if (visible) animateIn(); }, [visible, animateIn]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"   // 👈 critical on iOS
      statusBarTranslucent                  // 👈 critical on Android
      hardwareAccelerated
      onRequestClose={() => animateOut(onClose)}
    >
      <View style={[styles.modalOverlay, { alignItems: 'stretch' }]}>
        {/* Backdrop */}
        <AnimatedPressable
          style={[styles.modalBackdrop, backdropStyle]}
          onPress={() => animateOut(onClose)}
        />

        {/* Bottom Sheet */}
        <Animated.View
          key={visible ? 'modal-open' : 'modal-closed'}
          style={[
            styles.modalContent,
            sheetStyle,
            { width: '100%', alignSelf: 'stretch' }, // 👈 force full width
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable style={styles.closeButton} onPress={() => animateOut(onClose)}>
              <X size={24} color={THEME.colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.7, paddingHorizontal: THEME.spacing.lg }}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
});




export default function ProfileScreen() {
  const navigation = useNavigation();
  const { fetchUserData } = useRegisterStore();

  const [activeTab, setActiveTab] = useState('personal');
  const [showCustomerIdDropdown, setShowCustomerIdDropdown] = useState(false);



  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [base64img, setBase64Img] = useState("");
  const [referralId, setReferralId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bannerErr, setBannerErr] = useState("");
  const [customerId, setCustomerId] = useState("")
  const [whatsApp, setWhatsApp] = useState("+91 7048986551")
  const [addharNumber, setAddharNumber] = useState("");
  const [panNumber, setPanNumber] = useState("")
  const [Gender, setGender] = useState("");
  const [Useraddress, setUserAddress] = useState("")

  const [isSubmitted, setIsSubmitted] = useState(false);




  // -------- fetch

  const user = useUserStore(s => s.user);
  console.log("user", user)
  const kycDetails = useKycDetailStore(s => s.data);
  const fetchKyc = useKycDetailStore(s => s.fetchKyc);
  const kycStatus = useKycDetailStore(s => s.status);
  const kycError = useKycDetailStore(s => s.error);
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchKyc({ ttlMs: 10 * 60 * 1000 }); // 10 min TTL
      });
      return () => task.cancel?.();
    }, [fetchKyc])
  );

  useEffect(() => {
    fetchUserData();
  }, []);






  const getKycDetails = useCallback(() => {
    if (!kycDetails) {
      setLoading(false);
      return;
    }
    setBannerErr("");
    try {
      const aadhaar =
        kycDetails?.aadhar_details ||
        kycDetails?.aadhaar_details ||
        kycDetails?.aadhaar ||
        kycDetails;

      const _name = aadhaar?.name || aadhaar?.full_name || "";
      const _dateOfBirth = aadhaar?.dateOfBirth || aadhaar?.dob || "";
      const _phone = aadhaar?.phone || kycDetails?.phone || "";
      const _email = user?.user?.Email || kycDetails?.email || ""; // ensure we always define this to avoid ReferenceError
      const _img = aadhaar?.photo || aadhaar?.profile_image_b64 || "";
      const _ref = kycDetails?.referred_by_agent_id ? String(kycDetails.referred_by_agent_id) : "";
      const aadhaarAddress = aadhaar?.address || {};
      const addressParts = [
        aadhaarAddress.careOf,
        aadhaarAddress.house,
        aadhaarAddress.street,
        aadhaarAddress.landmark,
        aadhaarAddress.locality,
        aadhaarAddress.subDistrict,
        aadhaarAddress.district,
        aadhaarAddress.state,
        aadhaarAddress.country,
        aadhaarAddress.pin,
      ]
        .filter(Boolean)
        .join(", ");

      setName(_name);
      setPhone(_phone);
      setEmail(_email);
      setBase64Img(_img);
      setReferralId(user?.user?.introducer_id);
      setCustomerId(user?.user?.member_id || "");
      setDateOfBirth(formatDateToDDMMYYYY(_dateOfBirth) || "");
      setAddharNumber(aadhaar?.maskedNumber || aadhaar?.masked_aadhaar || aadhaar?.aadharNumber || "");
      setPanNumber(kycDetails?.pan?.pan_number || "");
      setGender(aadhaar?.gender || "");
      setUserAddress(addressParts || "");
    } catch (e) {
      setBannerErr(e?.message || "Failed to load your profile.");
    } finally {
      setLoading(false);
    }
  }, [kycDetails]);

  useEffect(() => {
    if (kycStatus === 'idle' && !kycDetails) {
      return;
    }
    if (kycStatus === 'loading') {
      setLoading(true);
      return;
    }
    if (kycStatus === 'error') {
      setBannerErr(kycError || "Failed to load your profile.");
      setLoading(false);
      return;
    }
    getKycDetails();
  }, [kycStatus, kycError, kycDetails, getKycDetails]);



  const ProfileHeader = () => (
    <View
      style={styles.headerGradient}
    >
      <View style={styles.headerContent} >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Image source={{ uri: `data:image/jpeg;base64,${base64img}` }} style={styles.profileImage} />
          </View>

        </View>

        <Text style={styles.userName}>{name}</Text>

        <View style={styles.professionalBadge}>
          <Text style={styles.professionalText}>Verified</Text>
        </View>

        <View style={styles.idSection}>
          <View style={styles.idItem}>
            <Text style={styles.idLabel}>Customer ID</Text>
            <TouchableOpacity
              style={styles.customerIdContainer}
              onPress={() => setShowCustomerIdDropdown(!showCustomerIdDropdown)}
            >
              <Text style={styles.customerId}>{customerId}</Text>
              {/* <ChevronDown size={16} color="rgba(255,255,255,0.8)" /> */}
            </TouchableOpacity>
          </View>

          <View style={styles.idItem}>
            <Text style={styles.idLabel}>Sponsor ID</Text>
            <TouchableOpacity style={styles.createUserIdContainer}>
              <Text style={styles.customerId}>{referralId}</Text>
              {/* <ChevronRight size={16} color="#3b82f6" /> */}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const TabSection = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
        onPress={() => setActiveTab('personal')}
      >
        <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
          Personal Details
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'kyc' && styles.activeTab]}
        onPress={() => setActiveTab('kyc')}
      >
        <Text style={[styles.tabText, activeTab === 'kyc' && styles.activeTabText]}>
          KYC
        </Text>
      </TouchableOpacity>
    </View>
  );

  const PersonalDetailsContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Email ID</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldValue}>{email ? email.slice(0, 12) + "******" + email.slice(-8) : "Add Your Email Address"}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("EmailVerify")}>
            <Text style={styles.updateButton}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Registered Mobile Number</Text>
        <Text style={styles.fieldValue}>{whatsApp}</Text>
      </View>


       <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Alternate Mobile Number</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldValueMultiline}>{whatsApp}</Text>
          <TouchableOpacity style={styles.updateButtonContainer} onPress={() => navigation.navigate("UpdateNumber")}>
            <Text style={styles.updateButton}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>





      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Marital Status  </Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldValueMultiline}>Un-Married</Text>
          <TouchableOpacity style={styles.updateButtonContainer}>
            <Text style={styles.updateButton}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Gender</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldValueMultiline}>{Gender == "M" ? "Male" : "Female"}</Text>
        </View>
      </View>


      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Occupation</Text>
        <TouchableOpacity onPress={() => navigation.navigate("UpdateOccupation")}>
          <Text style={styles.addButton}>Add</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Educational Qualification</Text>
        <TouchableOpacity onPress={() => navigation.navigate("UpdateEducation")}>
          <Text style={styles.addButton}>Add</Text>
        </TouchableOpacity>
      </View>


    

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Date of Birth</Text>
        <Text style={styles.fieldValue}>{dateOfBirth}</Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Communication Address</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldValueMultiline}>{Useraddress}</Text>
          <TouchableOpacity style={styles.updateButtonContainer} onPress={() => navigation.navigate("UpdateAddress", { addressType: "communication", currentAddress: Useraddress })}>
            <Text style={styles.updateButton}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Permanent Address</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldValueMultiline}>{Useraddress}</Text>
          <TouchableOpacity style={styles.updateButtonContainer} onPress={() => navigation.navigate("UpdateAddress", { addressType: "permanent", currentAddress: Useraddress })}>
            <Text style={styles.updateButton}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const KYCContent = ({ userInfo }) => (
    <View style={styles.contentContainer}>

      <View style={[styles.fieldContainer, styles.rowBetween]}>
        <View>
          <Text style={styles.fieldLabel}>Aadhaar Number</Text>
          <Text style={styles.fieldValue}>{userInfo?.aadharKycStatus === "verified" ? addharNumber : "Add Your Aadhaar Number"}</Text>
        </View>
        <View style={styles.rowAlign}>
          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>{userInfo?.aadharKycStatus === "verified" ? "Verified" : "Not Verified"}</Text>
          </View>

          {/* View Aadhaar Button */}
          {userInfo?.aadharKycStatus === "verified" ? (<Pressable
            onPress={() => navigation.navigate("AadharDetails")}
            style={[styles.viewButton, styles.viewButtonWithSpace]}
            android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: false }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Eye size={16} color="#374151" />
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>) : (
            <Pressable>
              <Text style={styles.addButton}>Add</Text>
            </Pressable>)}

        </View>
      </View>


      <View style={[styles.fieldContainer, styles.rowBetween]}>
        <View>
          <Text style={styles.fieldLabel}>PAN</Text>
          <Text style={styles.fieldValue}>{user?.panKycStatus === "verified" ? panNumber : "Add Your PAN Number"}</Text>
        </View>

        <View style={styles.rowAlign}>
          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>{user?.panKycStatus === "verified" ? "Verified" : "Not Verified"}</Text>
          </View>

          {/* View Aadhaar Button */}
          {
            user?.panKycStatus === "verified" ? (
              <Pressable
                onPress={() => navigation.navigate("PanDetails")}
                style={[styles.viewButton, styles.viewButtonWithSpace]}
                android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: false }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Eye size={16} color="#374151" />
                <Text style={styles.viewButtonText}>View</Text>
              </Pressable>) : (
              <Pressable>
                <Text style={styles.addButton}>Add</Text>
              </Pressable>)
          }
        </View>
      </View>




      <View style={styles.fieldContainer}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Re-KYC</Text>
          <TouchableOpacity>
            <Text style={styles.updateButton}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>






      {/* =============================================================== */}
      {/* Nominne Details */}
      {/* =============================================================== */}



      <View style={styles.fieldContainer}>
        <View>
          <View style={styles.rowBetween}>
            <Text style={styles.nomineeTitle}>
              Nominee Details
            </Text>
            <TouchableOpacity onPress={() => openModal('nominee')}>
              <Text style={styles.updateButton}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rowBetweenWithMargin}>
            <Text style={styles.nomineeSubtitle} >
              Add a nominee to secure your account/benefits.
            </Text>

          </View>
        </View>
      </View>




    </View>
  );





  const [modals, setModals] = useState({ nominee: false });

  const openModal = (key) => setModals(m => ({ ...m, [key]: true }));
  const closeModal = (key) => setModals(m => ({ ...m, [key]: false }));


  // ===============================================================
  // Nominee Modal State & Handlers
  // ===============================================================

  // Nominee form state
  const [nomineeName, setNomineeName] = useState("");
  const [relationship, setRelationship] = useState(""); // show placeholder until chosen
  const [dobDate, setDobDate] = useState(null);         // Date | null
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [aadhaar, setAadhaar] = useState("");

  // utils
  const onlyDigits = (s = "") => s.replace(/\D/g, "");
  const fmtDDMMYYYY = (d) => {
    if (!d) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const onChangeDobExpo = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDobPicker(false);
    if (event?.type === "dismissed") return;
    setDobDate(selectedDate || dobDate || new Date());
  };

  const onChangeMobile = (v) => setMobile(onlyDigits(v).slice(0, 10));
  const onChangeAadhaar = (v) => setAadhaar(onlyDigits(v).slice(0, 12));

  const canSave =
    nomineeName.trim().length >= 2 &&
    !!relationship &&
    !!dobDate &&
    mobile.length === 10 &&
    address.trim().length >= 5 &&
    aadhaar.length === 12;

  const saveNominee = async () => {
    if (!canSave) return;
    const payload = {
      name: nomineeName.trim(),
      relationship,
      dob: fmtDDMMYYYY(dobDate),
      mobile,
      address: address.trim(),
      aadhaar,
    };
    // TODO: call your API here
    // await apiRequest({ method: 'POST', endpoint: 'api/v1/nominee', body: payload });
    closeModal('nominee');
  };



  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <ProfileHeader />
        <View style={styles.contentSection}>
          <TabSection />
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'personal' ? <PersonalDetailsContent /> : <KYCContent userInfo={user} />}
          </ScrollView>
        </View>
      </View>


      <ModernModal
        visible={modals.nominee}
        onClose={() => closeModal('nominee')}
        title="Add Nominee Details"
      >

        {!isSubmitted ? (
          <View style={styles.modalForm}>
            {/* Full Name */}
            <View style={styles.modalFieldBlock}>
              <Text style={styles.modalLabel}>Full Name</Text>
              <TextInput
                value={nomineeName}
                onChangeText={setNomineeName}
                placeholder="Enter nominee's full name"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>

            {/* Relationship (Dropdown) */}
            <View style={styles.modalFieldBlock}>
              <Text style={styles.modalLabel}>Relationship</Text>
              <SimpleDropdown
                value={relationship}
                onChange={setRelationship}
                options={["Spouse", "Son", "Daughter", "Father", "Mother", "Siblings", "Other"]}
              />
            </View>


            {/* Date of Birth - Expo DateTimePicker */}
            <View style={styles.modalFieldBlock}>
              <Text style={styles.modalLabel}>Date of Birth</Text>

              <Pressable
                onPress={() => setShowDobPicker(true)}
                style={[styles.input, styles.inputCentered]}
              >
                <Text style={dobDate ? styles.inputText : styles.inputPlaceholder}>
                  {dobDate ? fmtDDMMYYYY(dobDate) : "DD/MM/YYYY"}
                </Text>
              </Pressable>

              {showDobPicker && (
                Platform.OS === "ios" ? (
                  <View style={styles.datePickerCard}>
                    <DateTimePicker
                      value={dobDate || new Date(1990, 0, 1)}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                      onChange={(_, d) => setDobDate(d || dobDate)}
                    />
                    <View style={styles.datePickerActions}>
                      <Pressable onPress={() => setShowDobPicker(false)} style={styles.datePickerDoneButton}>
                        <Text style={styles.datePickerDoneText}>Done</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <DateTimePicker
                    value={dobDate || new Date(1990, 0, 1)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    onChange={onChangeDobExpo}
                  />
                )
              )}
            </View>

            {/* Mobile Number */}
            <View style={styles.modalFieldBlock}>
              <Text style={styles.modalLabel}>Mobile Number</Text>
              <TextInput
                value={mobile}
                onChangeText={onChangeMobile}
                placeholder="Enter 10-digit mobile number"
                keyboardType="number-pad"
                maxLength={10}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
              {mobile.length > 0 && mobile.length < 10 && (
                <Text style={styles.errorText}>Mobile must be 10 digits</Text>
              )}
            </View>

            {/* Address */}
            <View style={styles.modalFieldBlock}>
              <Text style={styles.modalLabel}>Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter nominee's complete address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={styles.textArea}
              />
            </View>

            {/* ID Proof - Aadhaar */}
            <View style={styles.modalFieldBlock}>
              <Text style={styles.modalLabel}>ID Proof - Aadhaar Number</Text>
              <TextInput
                value={aadhaar}
                onChangeText={onChangeAadhaar}
                placeholder="Enter 12-digit Aadhaar number"
                keyboardType="number-pad"
                maxLength={12}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
              {aadhaar.length > 0 && aadhaar.length < 12 && (
                <Text style={styles.errorText}>Aadhaar must be 12 digits</Text>
              )}
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => closeModal('nominee')}
                style={[styles.modalActionButton, styles.modalCancelButton]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                disabled={!canSave}
                onPress={saveNominee}
                style={[
                  styles.modalActionButton,
                  styles.modalSaveButton,
                  !canSave && styles.modalSaveButtonDisabled,
                ]}
              >
                <Text style={canSave ? styles.modalSaveText : styles.modalSaveTextDisabled}>Save</Text>
              </Pressable>
            </View>

          </View>
        ) : (
          <View style={styles.successContainer}>
            <NomineSuccess />
          </View>
        )}

      </ModernModal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingBottom: 32,
    backgroundColor: "black"
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6b7280',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  professionalBadge: {
    backgroundColor: '#07691eff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  professionalText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fcfaf8ff',
  },
  idSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
  },
  idItem: {
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  customerIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerId: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 4,
  },
  createUserIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createUserIdText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3b82f6',
    marginRight: 4,
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
    marginTop: -16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#f8fafc',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    marginTop: 6,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  fieldContainer: {
    backgroundColor: 'white',
    marginBottom: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  fieldValueMultiline: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
    lineHeight: 22,
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  updateButtonContainer: {
    marginLeft: 16,
  },
  addButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  modalForm: {
    paddingBottom: 24,
  },
  modalFieldBlock: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
    color: '#111827',
  },
  inputCentered: {
    justifyContent: 'center',
  },
  inputText: {
    color: '#111827',
    fontSize: 15,
  },
  inputPlaceholder: {
    color: '#9ca3af',
    fontSize: 15,
  },
  datePickerCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  datePickerDoneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  datePickerDoneText: {
    color: '#000',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  textArea: {
    minHeight: 96,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  modalActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 12,
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: '#000',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    color: '#4b5563',
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  verifiedText: {
    color: '#15803d',
    fontWeight: '600',
    fontSize: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  viewButtonWithSpace: {
    marginLeft: 8,
  },
  viewButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  nomineeTitle: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  nomineeSubtitle: {
    color: '#4b5563',
    flexShrink: 1,
  },
  rowBetweenWithMargin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },




  // Modal Styles

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },


  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    position: 'relative',
  },
  modalHandle: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: THEME.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.card,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingBottom: 40,
    marginTop: 18,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unchecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.border,
  },
  dropdownContainer: {
    width: '100%',
  },
  dropdownField: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    color: '#111827',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOptionText: {
    color: '#1f2937',
  },
  dropdownOptionSelected: {
    color: '#000',
    fontWeight: '600',
  },
});



function SimpleDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select relationship",
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <View style={styles.dropdownContainer}>
      {/* Field */}
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.dropdownField}
      >
        <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color="#6B7280" />
      </Pressable>

      {/* List (inline, not absolute) */}
      {open && (
        <View style={styles.dropdownList}>
          {options.map((opt, idx) => {
            const selected = opt === value;
            return (
              <Pressable
                key={`${opt}-${idx}`}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={styles.dropdownOption}
              >
                <Text style={selected ? styles.dropdownOptionSelected : styles.dropdownOptionText}>
                  {opt}
                </Text>
                {selected ? <Check size={18} color="#000" /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
