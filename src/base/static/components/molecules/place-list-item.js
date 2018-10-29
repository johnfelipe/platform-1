import React from "react";
import styled from "react-emotion";
import PropTypes from "prop-types";
import { Button, IconButton } from "../atoms/buttons";
import { Header3 } from "../atoms/typography";
import { UserAvatar } from "../atoms/imagery";
import { Paragraph, SmallText } from "../atoms/typography";
import { placeConfigSelector } from "../../state/ducks/place-config";
import { appConfigSelector } from "../../state/ducks/app-config";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { HorizontalRule } from "../atoms/layout";
import sharePlace from "../../utils/share-place";

const PlaceContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  margin: "0px 16px 16px 16px",
});

const Header = styled("div")({
  display: "flex",
  flexDirection: "row",
  alignContent: "space-between",
});

const Body = styled("div")({
  display: "flex",
});

const PlaceInfo = styled("div")({
  display: "flex",
  flex: "0 30%",
  marginRight: "16px",
});
const AvatarContainer = styled("div")({
  flex: "0 30%",
  minWidth: "48px",
  marginRight: "8px",
});
const PlaceInfoContainer = styled("div")({
  display: "flex",
  flexWrap: "wrap",
});
const PlaceDescription = styled("div")({
  display: "flex",
  flexDirection: "column",
  flex: "1 70%",
});

const DescriptionItem = styled("div")({
  flex: "1 100%",
});

const PlaceTitle = styled("div")({
  display: "flex",
  flex: "1 60%",
});

const PlaceSocialContainer = styled("div")({
  display: "flex",
  flex: "0 40%",
  maxWidth: "160px",
  justifyContent: "flex-end",
  alignItems: "center",
});

const SocialMediaButton = styled(IconButton)({
  flex: "0 1",
  marginLeft: "16px",
});

const PlaceListItem = props => {
  const numberOfComments = props.place.submission_sets.comments
    ? props.place.submission_sets.comments.length
    : 0;
  const numberOfSupports = props.place.submission_sets.support
    ? props.place.submission_sets.support.length
    : 0;
  const submitterName =
    props.place.submitter_name || props.placeConfig.anonymous_name;
  const onSocialShare = service => {
    sharePlace({
      place: props.place,
      service,
      appTitle: props.appConfig.title,
      appMetaDescription: props.appConfig.meta_description,
      appThumbnail: props.appConfig.thumbnail,
    });
  };
  return (
    <React.Fragment>
      <PlaceContainer>
        <Header>
          <PlaceTitle>
            <Header3>{props.place.title}</Header3>
          </PlaceTitle>
          <PlaceSocialContainer>
            <SocialMediaButton
              icon="facebook"
              size="small"
              onClick={() => onSocialShare("facebook")}
            />
            <SocialMediaButton
              icon="twitter"
              size="small"
              onClick={() => onSocialShare("twitter")}
            />
          </PlaceSocialContainer>
        </Header>
        <Body>
          <PlaceInfo>
            <AvatarContainer>
              <UserAvatar size="large" />
            </AvatarContainer>
            <PlaceInfoContainer>
              <Paragraph>{`${submitterName} submitted this thing`}</Paragraph>
              <SmallText
                style={{ width: "100%" }}
              >{`${numberOfComments} comments`}</SmallText>
              <SmallText
                style={{ width: "100%" }}
              >{`${numberOfSupports} supports`}</SmallText>
              <Button color="primary" size="small" variant="raised">
                View on Map
              </Button>
            </PlaceInfoContainer>
          </PlaceInfo>
          <PlaceDescription>
            <DescriptionItem>
              <b>{"my project idea is:"}</b>
            </DescriptionItem>
            <DescriptionItem>{props.place["idea-what"]}</DescriptionItem>
          </PlaceDescription>
        </Body>
        {props.place.attachments.length ? (
          <img src={props.place.attachments[0].file} />
        ) : null}
      </PlaceContainer>
      <HorizontalRule color="light" />
    </React.Fragment>
  );
};

PlaceListItem.propTypes = {
  place: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  placeConfig: PropTypes.shape({
    anonymous_name: PropTypes.string.isRequired,
  }).isRequired,
  appConfig: PropTypes.shape({
    title: PropTypes.string.isRequired,
    meta_description: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
  }),
};

const mapStateToProps = state => ({
  placeConfig: placeConfigSelector(state),
  appConfig: appConfigSelector(state),
});

export default connect(mapStateToProps)(
  translate("PlaceListItem")(PlaceListItem),
);