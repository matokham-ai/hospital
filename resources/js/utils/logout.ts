export async function performLogout(redirectTo: string = '/login'): Promise<void> {
    try {
        await window.axios.post('/logout');
    } catch (error) {
        console.error('[Logout] Failed to complete cleanly; forcing redirect.', error);
    } finally {
        window.location.href = redirectTo;
    }
}
