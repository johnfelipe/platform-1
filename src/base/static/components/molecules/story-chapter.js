import React from "react";
import PropTypes from "prop-types";
import styled from "@emotion/styled";

import { InternalLink, SmallText } from "../atoms/typography";

const StoryChapterWrapper = styled(props => (
  <InternalLink href={props.href} className={props.className}>
    {props.children}
  </InternalLink>
))(props => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  marginLeft: "8px",
  padding: "10px",
  borderLeft: "2px solid transparent",
  textDecoration: "none",
  backgroundColor: props.isSelected ? props.theme.brand.accent : "#fff",
  color: props.isSelected ? "#fff" : "#222",

  "&:hover": {
    cursor: "pointer",
    borderLeft: `2px solid ${props.theme.brand.accent}`,
    color: props.isSelected ? "#fff" : props.theme.brand.accent,
  },
}));

const StoryChapterTitle = styled(props => (
  <SmallText textTransform="uppercase" className={props.className}>
    {props.children}
  </SmallText>
))(() => ({
  paddingLeft: "8px",
}));

const StoryChapter = props => {
  return (
    <StoryChapterWrapper
      href={"/" + props.placeUrl}
      isSelected={props.isSelected}
    >
      <img src={props.iconUrl} style={{ width: "30px", maxWidth: "30px" }} />
      <StoryChapterTitle>{props.title}</StoryChapterTitle>
    </StoryChapterWrapper>
  );
};

StoryChapter.propTypes = {
  placeUrl: PropTypes.string.isRequired,
  iconUrl: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
};

export default StoryChapter;
