import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import Icon from './Icon';

interface SnackbarProps {
    message: string;
    isError?: boolean;
}

export const SnackbarContent = ({ message, isError = false }: SnackbarProps) => {
    return (
        <Box position="fixed" bottom={8} left="50%" transform="translateX(-50%)" bg={isError ? "red.600" : "green.600"} color="white" px={6} py={3} borderRadius="lg" boxShadow="xl" display="flex" alignItems="center" gap={3} zIndex={9999}>
            <Icon name={isError ? 'error' : 'check_circle'} size={24} />
            <Text fontSize="md" fontWeight="medium">{message}</Text>
        </Box>
    );
};
