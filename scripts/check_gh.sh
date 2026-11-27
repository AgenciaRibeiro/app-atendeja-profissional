cat << 'EOF' > /tmp/check_gh_app.php
<?php
use App\Models\GithubApp;

$source = GithubApp::find(1);
echo "GitHub App: " . $source->name . "\n";
try {
    $res = githubApi($source, "installation/repositories");
    print_r(data_get($res, 'data.repositories.*.full_name'));
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
EOF

docker cp /tmp/check_gh_app.php coolify:/var/www/html/check_gh_app.php
docker exec coolify php -r "require '/var/www/html/vendor/autoload.php'; \$app = require_once '/var/www/html/bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); require '/var/www/html/check_gh_app.php';"
