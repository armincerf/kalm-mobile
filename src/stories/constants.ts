import styled from "styled-components/native";


export const COLORS = {
  white: "#FFFFFF",
  gray: "#444444",
  red: "#FF5555",
};

export const Wrapper = styled.View`
  margin-bottom: 15px;
`;

export const Label = styled.Text`
  color: ${COLORS.gray};
  font-size: 10px;
  letter-spacing: 2px;
`;


export const Error = styled.Text`
  color: ${COLORS.red};
`;
