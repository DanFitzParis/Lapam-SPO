import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from '@react-email/components';

interface ApplicationAcknowledgementProps {
  candidateName: string;
  jobTitle: string;
  companyName?: string;
}

export function ApplicationAcknowledgement({
  candidateName,
  jobTitle,
  companyName = 'Lapam',
}: ApplicationAcknowledgementProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>Application Received</Heading>
            <Text style={text}>
              Hi {candidateName},
            </Text>
            <Text style={text}>
              Thank you for applying for the <strong>{jobTitle}</strong> role with {companyName}.
              We have received your application and will review it shortly.
            </Text>
            <Text style={text}>
              We'll be in touch soon with next steps.
            </Text>
            <Text style={text}>
              Best regards,
              <br />
              {companyName} Recruitment Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const section = {
  padding: '0 48px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
};

const text = {
  margin: '0 0 10px 0',
  fontSize: '16px',
  lineHeight: '24px',
  color: '#484848',
};

export default ApplicationAcknowledgement;
