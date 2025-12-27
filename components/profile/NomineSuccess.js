import { useNavigation } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import React, { useEffect } from "react";
import { Dimensions, Text, View } from "react-native";
import sucessAni from '../../Animation/success.json'


const { width, height } = Dimensions.get("window");

export function NomineSuccess() {
    const navigation = useNavigation();

    const animation = React.useRef(null);



    useEffect(() => {
        // Play animation on mount
        if (animation.current) {
            animation.current.play();
        }
    }, []);
    return (
        <View className="flex-1 bg-white px-6 justify-center items-center">
            <View>


                <LottieView
                    ref={animation}
                    source={sucessAni}
                    style={{
                        width: width * 0.4,
                        height: width * 0.4,
                        marginTop: 20,
                    }}
                    autoPlay
                    loop={false}
                />
            </View>
            {/* <View className="m-0"> */}
            <Text className="text-[19px] font-bold text-gray-800 mb-2 text-center"> Nominee Added Successfully!</Text>
            <Text className="text-[13px] text-gray-500 mx-4 text-center mb-8 leading-6">
                Your nominee details have been saved.
            </Text>
           
        </View>
    );
}