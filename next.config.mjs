/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Add raw-loader for .c files
        config.module.rules.push({
            test: /\.glsl$/,
            use: 'raw-loader'
        });

        return config;
    }
};

export default nextConfig;
