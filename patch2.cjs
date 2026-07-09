const fs = require('fs');
let content = fs.readFileSync('src/pages/Withdraw.tsx', 'utf8');

const findBlock = `      if (parseFloat(amount) > (user?.balance || 0)) {
        toast.error('Insufficient balance');
        setError('Insufficient balance');
        return;
      }

      setLoading(true);

      let destination = '';
      if (method === 'bank') destination = \`\${bank} - \${bankAccount}\`;
      else destination = \`\${method === 'mtn' ? 'MTN' : 'Orange'} - \${phoneNumber}\`;

      try {
        const res = await fetch('/api/transactions/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?._id,
            amount: parseFloat(amount),
            bankAccount: destination
          })
        });
        const data = await res.json();

        if (res.ok) {
          if (user) {
            const updatedUser = { ...user, balance: data.newBalance };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
          setPendingWithdrawal(false);
          setStep(2);
        } else {
          setError(data.error || 'Withdrawal failed');
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
  };`;

const replaceBlock = `      if (parseFloat(amount) > (user?.balance || 0)) {
        toast.error('Insufficient balance');
        setError('Insufficient balance');
        return;
      }

      // Show PIN approval modal before processing
      setPin('');
      setPinError('');
      setTimeLeft(60);
      setShowPinModal(true);
    }
  };

  const processDirectWithdrawal = async () => {
    if (pin !== String(user?.pin)) {
      setPinError('Invalid PIN');
      return;
    }
    setShowPinModal(false);
    setLoading(true);

    let destination = '';
    if (method === 'bank') destination = \`\${bank} - \${bankAccount}\`;
    else destination = \`\${method === 'mtn' ? 'MTN' : 'Orange'} - \${phoneNumber}\`;

    try {
      const res = await fetch('/api/transactions/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?._id,
          amount: parseFloat(amount),
          bankAccount: destination
        })
      });
      const data = await res.json();

      if (res.ok) {
        if (user) {
          const updatedUser = { ...user, balance: data.newBalance };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        setPendingWithdrawal(false);
        setStep(2);
      } else {
        setError(data.error || 'Withdrawal failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(findBlock, replaceBlock);

fs.writeFileSync('src/pages/Withdraw.tsx', content);
