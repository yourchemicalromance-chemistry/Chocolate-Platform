export async function runEmailOtpAction<T>(
    action: () => Promise<T>,
    setLoading: (loading: boolean) => void,
    setError: (message: string) => void,
): Promise<T> {
    setLoading(true);
    setError('');
    try {
        return await action();
    } catch (error) {
        setError(error instanceof Error ? error.message : 'Please try again.');
        throw error;
    } finally {
        setLoading(false);
    }
}
