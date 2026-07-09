async function run() {
  const tokenRes = await fetch("https://demo.campay.net/api/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "NsyvWdqRE9AqkscqMnYKpwBqJZVRcaCxtRAdSj0k2IRS5vAdF32hEAp5TCV8IllsPPxQJn89dK7WNsY91wbnjA",
      password: "Ryiq-jJNiuy5zjDmYyDUnxLDaNUcM4mBExwdqUSBoZTveFcYlRvT055bpF3PX2tflJC2EKl2aW7ImoFHuXjQfw"
    })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.token;

  console.log("Token:", token);

  const withdrawRes = await fetch("https://demo.campay.net/api/withdraw/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`
    },
    body: JSON.stringify({
      amount: 10,
      to: "237670000000",
      description: "from paycam",
      external_reference: "paycam-" + Date.now()
    })
  });
  console.log(await withdrawRes.json());
}
run();
