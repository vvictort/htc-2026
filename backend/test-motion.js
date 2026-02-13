require('dotenv').config();
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}

async function testMotion() {
    const listResult = await admin.auth().listUsers(1);
    if (listResult.users.length === 0) {
        console.log('No users found');
        return;
    }
    const uid = listResult.users[0].uid;
    console.log('User UID:', uid);

    const customToken = await admin.auth().createCustomToken(uid);
    const apiKey = process.env.FIREBASE_API_KEY;
    const tokenResp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        }
    );
    const tokenData = await tokenResp.json();
    if (!tokenData.idToken) {
        console.log('Failed to get token:', tokenData);
        return;
    }
    const idToken = tokenData.idToken;
    console.log('✅ Got Firebase ID token');

    console.log('\n━━━ Test 1: face_covered (expect DANGER) ━━━');
    const res1 = await fetch('http://localhost:5000/api/motion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            category: 'face_covered',
            confidence: 0.95,
        }),
    });
    const data1 = await res1.json();
    console.log(`Status: ${res1.status}`);
    console.log('Response:', JSON.stringify(data1, null, 2));

    console.log('\n━━━ Test 2: flailing (expect CAUTION) ━━━');
    const res2 = await fetch('http://localhost:5000/api/motion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            category: 'flailing',
            confidence: 0.8,
        }),
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status}`);
    console.log('Response:', JSON.stringify(data2, null, 2));

    console.log('\n━━━ Test 3: still (expect SAFE, no notif) ━━━');
    const res3 = await fetch('http://localhost:5000/api/motion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            category: 'still',
            confidence: 0.99,
        }),
    });
    const data3 = await res3.json();
    console.log(`Status: ${res3.status}`);
    console.log('Response:', JSON.stringify(data3, null, 2));

    console.log('\n✅ Done! Check your phone for SMS and email inbox for alerts.');
}

testMotion().catch(console.error);
