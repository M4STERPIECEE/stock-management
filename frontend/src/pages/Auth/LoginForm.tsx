import React, { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    Stack,
    Checkbox,
    Link,
    Image,
    Container,
    IconButton,
    InputGroup,
    Span
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '../../components/ui/color-mode';

const SnackbarContent = ({ message, isError = false }: { message: string, isError?: boolean }) => {
    return (
        <Box position="fixed" bottom={8} left="50%" transform="translateX(-50%)" bg={isError ? "red.600" : "green.600"} color="white" px={6} py={3} borderRadius="lg" boxShadow="xl" display="flex" alignItems="center" gap={3} zIndex={9999} animation="fade-in 0.3s">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                {isError ? 'error' : 'check_circle'}
            </span>
            <Text fontSize="md" fontWeight="medium">{message}</Text>
        </Box>
    );
};

const LoginFormContent = () => {
    const { colorMode } = useColorMode();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const mainText = "textMain";
    const subText = "textSub";
    const borderColor = "border";
    const inputBg = "inputBg";
    const inputBorder = "inputBorder";
    const cardBg = "card";
    const gradientLight = "linear-gradient(to bottom right, #eff6ff, #e2e8f0)";
    const gradientDark = "linear-gradient(to bottom right, #0f172a, #1e293b)";
    const bgGradient = colorMode === 'light' ? gradientLight : gradientDark;
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);
        try {
            const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setErrorMessage('Email ou mot de passe incorrect.');
                } else {
                    setErrorMessage('Erreur lors de la connexion. Réessayez.');
                }
                return;
            }

            const data: { access_token?: string } = await response.json();
            if (!data?.access_token) {
                setErrorMessage('Réponse invalide du serveur (token manquant).');
                return;
            }

            const storage = rememberMe ? window.localStorage : window.sessionStorage;
            storage.setItem('access_token', data.access_token);
            navigate('/dashboard', { replace: true });
        } catch {
            setErrorMessage('Impossible de contacter le serveur.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Span display="contents" className={`chakra-theme ${colorMode}`}>
            <Flex direction="column" minH="100vh" fontFamily="'Poppins', sans-serif" bg="background" color={mainText}>
            <Box as="header" w="full" borderBottom="1px" borderColor={borderColor} bg={cardBg} pos="sticky" top="0" zIndex="50">
                <Container maxW="1280px" px={{ base: 4, sm: 10 }} py="3">
                    <Flex align="center" justify="space-between">
                        <Flex align="center" gap="4">
                            <Box w="8" h="8" color="primary">
                                <svg width="100%" height="100%" viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fillRule="evenodd"></path>
                                </svg>
                            </Box>
                            <Text fontSize="lg" fontWeight="bold" lineHeight="tight" letterSpacing="tight">GestionStock</Text>
                        </Flex>
                        <Button minW="84px" h="9" px="4" bg={colorMode === 'light' ? "#e7edf3" : "whiteAlpha.200"} color={mainText} _hover={{ bg: colorMode === 'light' ? "gray.200" : "whiteAlpha.300" }} fontSize="sm" fontWeight="bold" borderRadius="lg">
                            Aide
                        </Button>
                    </Flex>
                </Container>
            </Box>
            <Flex flex="1" align="center" justify="center" p="4" pos="relative" overflow="hidden">
                <Box pos="absolute" inset="0" zIndex="0" pointerEvents="none" opacity="0.4">
                    <Box pos="absolute" inset="0" bgGradient={bgGradient} />
                    <Image src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZXOSgAqGoxpT_yuanlCoGEduvqDHNWmHmGmknRJvdlpc6s3OG0EVol0GUOSV88TI7QQWRYl7aHIgPYILOz70HGNhDOJ9KGjzF0kSR-MOFPs0Rk0Kx8IDS27ARAq89xWSQhjICjZSX1WMrsUjH9FZV4zcbKNVZEMDrnFuwMOC1zWG5Qbid7bdFrkwFhKbyHyNYjWIvNT-o-bTWfPPlmWJhGObJRZFO8aGhXHvl9YZJgDAJ4gQidM3DfvQW6F3hQXsElkgdvfiIAub-" alt="Background" pos="absolute" inset="0" w="full" h="full" objectFit="cover" mixBlendMode="overlay" opacity="0.2"/>
                </Box>
                <Box pos="relative" zIndex="10" w="full" maxW="480px" bg={cardBg} borderRadius="xl" boxShadow="2xl" border="1px" borderColor={colorMode === 'light' ? "gray.100" : "slate.800"}>
                    <Box p="8" pb="4">
                        <Stack gap="2" textAlign="center">
                            <Text fontSize="3xl" fontWeight="900" lineHeight="tight" letterSpacing="-0.033em" color={mainText}>
                                Connexion Admin
                            </Text>
                            <Text color={subText} fontSize="md" fontWeight="normal">
                                Veuillez vous authentifier pour accéder au tableau de bord de gestion.
                            </Text>
                        </Stack>
                    </Box>
                    <Box px="8" pb="8" pt="2">
                        <form onSubmit={handleSubmit}>
                            <Stack gap="5">
                                <Box>
                                    <Text fontSize="sm" fontWeight="medium" mb="1.5" color={mainText}>Email ou Nom d'utilisateur</Text>
                                    <InputGroup w="full" startElement={
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: colorMode === 'light' ? '#4c739a' : '#64748b' }}>person</span>
                                    }>
                                        <Input value={email} onChange={(e) => setEmail(e.target.value)} name="email" type="email" autoComplete="email" placeholder="admin@societe.com" size="lg" bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: "primary", ring: "1px", ringColor: "primary" }} fontSize="md" h="12" borderRadius="lg"/>
                                    </InputGroup>
                                </Box>
                                <Box>
                                    <Flex justify="space-between" align="center" mb="1.5">
                                        <Text fontSize="sm" fontWeight="medium" color={mainText}>Mot de passe</Text>
                                    </Flex>
                                    <InputGroup w="full"
                                        startElement={
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: colorMode === 'light' ? '#4c739a' : '#64748b' }}>lock</span>
                                        }
                                        endElement={
                                            <IconButton variant="ghost" aria-label="Toggle password" onClick={() => setShowPassword(!showPassword)} color={subText} size="sm" bg="transparent" _hover={{ bg: "transparent", color: "primary" }} _active={{ bg: "transparent" }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                    {showPassword ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </IconButton>}>
                                        <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} name="password" autoComplete="current-password" placeholder="••••••••" size="lg" bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: "primary", ring: "1px", ringColor: "primary" }} fontSize="md" h="12" borderRadius="lg"/>
                                    </InputGroup>
                                </Box>
                                <Flex align="center" justify="space-between" mt="1">
                                    <Checkbox.Root colorPalette="blue" variant="subtle" checked={rememberMe} onCheckedChange={(details) => setRememberMe(Boolean(details.checked))}>
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control border="1px solid" borderColor="gray.300" _checked={{ bg: "primary", borderColor: "primary" }} borderRadius="sm" />
                                        <Checkbox.Label fontSize="sm" color={subText} _groupHover={{ color: mainText }} transition="colors">
                                            Se souvenir de moi
                                        </Checkbox.Label>
                                    </Checkbox.Root>
                                    <Link fontSize="sm" fontWeight="semibold" color="primary" _hover={{ color: "blue.700", textDecoration: "underline" }} onClick={() => navigate('/forgot-password')}>
                                        Mot de passe oublié ?
                                    </Link>
                                </Flex>
                                <Button w="full" h="12" bg="primary" color="white" fontSize="md" fontWeight="bold" letterSpacing="0.015em" _hover={{ bg: "blue.600" }} _active={{ transform: "scale(0.98)" }} mt="2" borderRadius="lg" type="submit" disabled={isSubmitting} loading={isSubmitting}>
                                    Se connecter
                                </Button>

                                {errorMessage && <SnackbarContent message={errorMessage} isError />}
                            </Stack>
                        </form>
                    </Box>
                    <Box px="8" py="4" bg={inputBg} borderTop="1px" borderColor={borderColor} borderBottomRadius="xl" display="flex" justifyContent="center">
                        <Text fontSize="xs" color={subText} textAlign="center">
                            Protégé par reCAPTCHA et soumis aux règles de confidentialité.
                        </Text>
                    </Box>
                </Box>
            </Flex>
            <Box as="footer" w="full" py="6" textAlign="center" zIndex="10">
                <Text fontSize="sm" color={subText}>
                    © 2025 M4STERPIECE. Tous droits réservés.
                </Text>
            </Box>
            </Flex>
        </Span>
    );
}

const LoginForm = () => {
    return <LoginFormContent />;
};

export default LoginForm;
