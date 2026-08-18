// Shared biller logo.
//
// Every BBPS screen needs the same thing: show the biller's mark, and degrade
// gracefully when it doesn't exist. Only ~1.2k of the 22k billers have a logo on
// the asset CDN (TATA Play, for one, 404s), and the `blr_image` field on the
// biller record is null for effectively all of them — so the logo must be
// derived from the biller id, and the 404 must be handled.
//
// Before this existed, the detail screens fell back to a hardcoded Google Play
// image URL, which rendered a stranger's "Logo Maker" app icon next to the
// customer's bill.

import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import Theme from "../Theme";
import { billerLogoUri } from "../../utils/helper";

const initialsOf = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";

const BillerLogo = ({ billerId, billerName = "", size = 44, style }) => {
  const [failed, setFailed] = useState(false);
  const uri = billerLogoUri(billerId);

  const box = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, box, style]}
        onError={() => setFailed(true)}
        accessibilityLabel={billerName ? `${billerName} logo` : "Biller logo"}
      />
    );
  }

  return (
    <View
      style={[styles.fallback, box, style]}
      accessibilityLabel={billerName || "Biller"}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {initialsOf(billerName)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: "#fff",
    resizeMode: "contain",
  },
  fallback: {
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: Theme.colors.secondary,
    fontWeight: "700",
  },
});

export default React.memo(BillerLogo);
