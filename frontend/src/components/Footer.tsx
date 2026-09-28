import React from 'react';
import {
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface FooterProps {
  name?: string;
  email?: string;
  linkedinUrl?: string;
}

export default function Footer({
  name = 'Riddhi Banerjee',
  email = 'riddhib.works@gmail.com',
  linkedinUrl = 'https://www.linkedin.com/in/riddhi-bandyopadhyay/',
}: FooterProps) {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Job Feed', path: '/jobs' },
    { label: 'Saved Jobs', path: '/saved-jobs' },
    { label: 'Resumes & Matching', path: '/resumes' },
    { label: 'Job Sources', path: '/job-sources' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        bgcolor: '#FFFFFF',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF5F7 100%)',
        borderTop: '1px solid #EFE6E8',
        pt: { xs: 6, md: 8 },
        pb: { xs: 4, md: 5 },
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Multi-column Content */}
        <Grid container spacing={{ xs: 4, md: 6 }} justifyContent="space-between">
          {/* Brand & Mission Column */}
          <Grid item xs={12} md={5}>
            <Box sx={{ maxWidth: 440 }}>
              {/* Brand Logo */}
              <Box
                onClick={() => handleNavClick('/')}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  mb: 2,
                  userSelect: 'none',
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'Archivo', sans-serif",
                    fontWeight: 800,
                    fontSize: { xs: '1.4rem', sm: '1.6rem' },
                    color: '#241019',
                    letterSpacing: '-0.025em',
                  }}
                >
                  Hired
                  <Box component="span" sx={{ color: '#E8336D' }}>
                    AI
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: '#E8336D',
                      ml: 0.5,
                      mb: 0.3,
                      boxShadow: '0 0 10px rgba(232, 51, 109, 0.5)',
                    }}
                  />
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: '#8A6E76',
                  lineHeight: 1.7,
                  mb: 3,
                  fontSize: '0.92rem',
                }}
              >
                Empowering developers and job seekers with automated ingestion, real-time feed updates,
                and AI-driven resume matching to supercharge career growth.
              </Typography>

              {/* Status Badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 6,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #EFE6E8',
                  boxShadow: '0 2px 6px rgba(36, 16, 25, 0.03)',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#10B981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: '#241019',
                    fontSize: '0.8rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  Live Feeds Active & Operational
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Quick Navigation Column */}
          <Grid item xs={12} sm={5} md={3}>
            <Typography
              variant="subtitle2"
              sx={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 700,
                color: '#241019',
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                mb: 2.5,
              }}
            >
              Navigation
            </Typography>

            <Stack spacing={1.25}>
              {navLinks.map((link) => (
                <Box
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    color: '#8A6E76',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: '#E8336D',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ArrowForwardIcon sx={{ fontSize: 13, opacity: 0.6 }} />
                  {link.label}
                </Box>
              ))}
            </Stack>
          </Grid>

          {/* Connect & Creator Column */}
          <Grid item xs={12} sm={7} md={4}>
            <Typography
              variant="subtitle2"
              sx={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 700,
                color: '#241019',
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                mb: 2.5,
              }}
            >
              Connect & Inquiries
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#8A6E76',
                lineHeight: 1.6,
                fontSize: '0.88rem',
                mb: 2.5,
              }}
            >
              Created by <Box component="span" sx={{ color: '#241019', fontWeight: 700 }}>{name}</Box>. Reach out for collaborations, feedback, or inquiries.
            </Typography>

            {/* Themed Social / Contact Cards */}
            <Stack spacing={1.75}>
              {/* Themed LinkedIn Card */}
              <Link
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #EFE6E8',
                  boxShadow: '0 2px 6px rgba(36, 16, 25, 0.02)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: '#E8336D',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(232, 51, 109, 0.12)',
                    '& .linkedin-icon-box': {
                      bgcolor: '#E8336D',
                      color: '#FFFFFF',
                      transform: 'scale(1.05)',
                    },
                    '& .link-title': {
                      color: '#A31346',
                    },
                    '& .external-arrow': {
                      transform: 'translate(2px, -2px)',
                      color: '#E8336D',
                    },
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  {/* Themed LinkedIn Logo Icon Box */}
                  <Box
                    className="linkedin-icon-box"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2.5,
                      bgcolor: '#FFD9E4',
                      color: '#A31346',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <LinkedInIcon sx={{ fontSize: 22 }} />
                  </Box>

                  <Box>
                    <Typography
                      className="link-title"
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: '#241019',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      LinkedIn
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#8A6E76',
                        fontSize: '0.78rem',
                        display: 'block',
                      }}
                    >
                      in/riddhi-bandyopadhyay
                    </Typography>
                  </Box>
                </Box>

                <OpenInNewIcon
                  className="external-arrow"
                  sx={{
                    fontSize: 16,
                    color: '#8A6E76',
                    mr: 0.5,
                    transition: 'all 0.2s ease',
                  }}
                />
              </Link>

              {/* Themed Email Card */}
              <Link
                href={`mailto:${email}`}
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #EFE6E8',
                  boxShadow: '0 2px 6px rgba(36, 16, 25, 0.02)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: '#E8336D',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(232, 51, 109, 0.12)',
                    '& .email-icon-box': {
                      bgcolor: '#E8336D',
                      color: '#FFFFFF',
                      transform: 'scale(1.05)',
                    },
                    '& .link-title': {
                      color: '#A31346',
                    },
                    '& .external-arrow': {
                      transform: 'translate(2px, -2px)',
                      color: '#E8336D',
                    },
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  {/* Themed Email Logo Icon Box */}
                  <Box
                    className="email-icon-box"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2.5,
                      bgcolor: '#FFD9E4',
                      color: '#A31346',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <EmailIcon sx={{ fontSize: 20 }} />
                  </Box>

                  <Box>
                    <Typography
                      className="link-title"
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: '#241019',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      Email Me
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#8A6E76',
                        fontSize: '0.78rem',
                        display: 'block',
                      }}
                    >
                      {email}
                    </Typography>
                  </Box>
                </Box>

                <OpenInNewIcon
                  className="external-arrow"
                  sx={{
                    fontSize: 16,
                    color: '#8A6E76',
                    mr: 0.5,
                    transition: 'all 0.2s ease',
                  }}
                />
              </Link>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 4, md: 5 }, borderColor: '#EFE6E8' }} />

        {/* Bottom Bar: Copyright & Attribution */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          textAlign={{ xs: 'center', sm: 'left' }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#8A6E76',
              fontSize: '0.86rem',
            }}
          >
            &copy; {currentYear}{' '}
            <Box
              component="span"
              sx={{
                fontWeight: 700,
                color: '#241019',
              }}
            >
              {name}
            </Box>
            . All rights reserved.
          </Typography>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              fontSize: '0.84rem',
              color: '#8A6E76',
            }}
          >
            <Typography variant="caption" sx={{ color: '#8A6E76' }}>
              Built with React, Vite & Spring Boot
            </Typography>

            <Box component="span" sx={{ color: '#EFE6E8' }}>•</Box>

            {/* Quick mini icon badges in theme */}
            <IconButton
              component="a"
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
              size="small"
              sx={{
                color: '#A31346',
                bgcolor: '#FFD9E4',
                p: 0.6,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#E8336D',
                  color: '#FFFFFF',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <LinkedInIcon sx={{ fontSize: 16 }} />
            </IconButton>

            <IconButton
              component="a"
              href={`mailto:${email}`}
              aria-label="Send email"
              size="small"
              sx={{
                color: '#A31346',
                bgcolor: '#FFD9E4',
                p: 0.6,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#E8336D',
                  color: '#FFFFFF',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <EmailIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
