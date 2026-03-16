import axios from 'axios';
import { Octokit } from 'octokit';
import { User } from '../types/index.js';
import crypto from 'crypto';

export class AuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Generate the GitHub OAuth authorization URL
   */
  generateAuthUrl(): string {
    const state = crypto.randomBytes(16).toString('hex');
    const scope = 'repo,user:email';

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.append('client_id', this.clientId);
    url.searchParams.append('redirect_uri', this.redirectUri);
    url.searchParams.append('scope', scope);
    url.searchParams.append('state', state);

    return url.toString();
  }

  /**
   * Exchange OAuth code for an access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
      });

      const params = new URLSearchParams(response.data);
      const accessToken = params.get('access_token');

      if (!accessToken) {
        throw new Error('No access token in response');
      }

      return accessToken;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Get user information from GitHub
   */
  async getUserInfo(accessToken: string): Promise<User> {
    try {
      const octokit = new Octokit({ auth: accessToken });

      // Get user info
      const userResponse = await octokit.rest.users.getAuthenticated();

      // Get primary email
      const emailResponse = await octokit.rest.users.listEmailsForAuthenticatedUser();
      const primaryEmail =
        emailResponse.data.find((e) => e.primary)?.email || userResponse.data.email || 'noemail@github.com';

      // Create user object
      const user: User = {
        id: `github-${userResponse.data.id}`,
        githubId: userResponse.data.id,
        username: userResponse.data.login,
        email: primaryEmail,
        avatarUrl: userResponse.data.avatar_url,
        accessToken: accessToken,
        repoUrl: '', // Will be set when creating/cloning repo
      };

      return user;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  /**
   * Create or get user's data repository
   */
  async initializeUserRepo(user: User): Promise<string> {
    try {
      const octokit = new Octokit({ auth: user.accessToken });
      const repoName = `windows-clone-data`;

      // Try to get existing repo
      try {
        const repoResponse = await octokit.rest.repos.get({
          owner: user.username,
          repo: repoName,
        });

        user.repoUrl = repoResponse.data.clone_url;
        return repoResponse.data.clone_url;
      } catch (error: any) {
        // If repo doesn't exist (404), create it
        if (error.status === 404) {
          const createResponse = await octokit.rest.repos.createForAuthenticatedUser({
            name: repoName,
            description: 'Windows Clone application data storage',
            private: true,
            auto_init: true,
          });

          user.repoUrl = createResponse.data.clone_url;
          return createResponse.data.clone_url;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error initializing user repo:', error);
      throw error;
    }
  }

  /**
   * Verify access token is still valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const octokit = new Octokit({ auth: accessToken });
      await octokit.rest.users.getAuthenticated();
      return true;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }
}
